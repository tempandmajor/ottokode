// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: propose-diff
// Generates a unified diff for a file given the original content and a user instruction.
// - Prefers OpenAI (OPENAI_API_KEY) to propose the new file content
// - Falls back to returning the original content unchanged if no provider configured
// - Returns a unified diff (no prose) and basic metadata
// Security: Requires Authorization: Bearer <JWT>

// Minimal unified diff generator to avoid external module dependencies
function createUnifiedPatch(filePath: string, original: string, updated: string): string {
  const origLines = original.split("\n");
  const newLines = updated.split("\n");

  // If identical, return an empty diff with headers
  if (original === updated) {
    return `--- ${filePath}\n+++ ${filePath}\n`;
  }

  const header = `--- ${filePath}\n+++ ${filePath}`;
  // Single-hunk naive patch from start of file
  const oldCount = Math.max(1, origLines.length);
  const newCount = Math.max(1, newLines.length);
  const hunkHeader = `@@ -1,${oldCount} +1,${newCount} @@`;

  const hunkBody: string[] = [];
  // Very naive: output deletions for all original lines, then additions for all new lines.
  // This ensures a valid, applyable patch for full-file replacements.
  for (const line of origLines) {
    hunkBody.push(`-${line}`);
  }
  for (const line of newLines) {
    hunkBody.push(`+${line}`);
  }

  return [header, hunkHeader, ...hunkBody].join("\n");
}

interface ProposeDiffRequest {
  file_path: string;
  original_content: string;
  user_instruction: string;
  retrieved_context?: string;
  provider?: "anthropic" | "openai" | "auto"; // default "auto" prefers Anthropic
  model?: string; // optional specific model id
}

interface ProposeDiffResponse {
  unified_diff: string;
  file_path: string;
  changed: boolean;
  provider: "anthropic" | "openai" | "local";
  model?: string;
}

function normalizeNewlines(s: string) {
  return s.replaceAll("\r\n", "\n");
}

async function proposeWithOpenAI(prompt: string, model?: string): Promise<{ content: string; usedModel: string }> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const chosen = model || "gpt-5-nano";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: chosen,
      messages: [
        {
          role: "system",
          content:
            "You are a code transformation engine. You will receive a file's current content, an instruction, and optional context. Return ONLY the full, final file content with the requested changes applied. Do NOT include markdown fences, explanations, or diff format.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI HTTP ${res.status}: ${text}`);
  }
  const data = await res.json();
  const content = String(data?.choices?.[0]?.message?.content ?? "");
  return { content, usedModel: chosen };
}

async function proposeWithAnthropic(prompt: string, model?: string): Promise<{ content: string; usedModel: string }> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const chosen = model || "claude-4-sonnet";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: chosen,
      max_tokens: 4096,
      temperature: 0.2,
      system: "You are a code transformation engine. Return ONLY the full, final file content. No prose, no markdown fences.",
      messages: [
        { role: "user", content: prompt }
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic HTTP ${res.status}: ${text}`);
  }
  const data = await res.json();
  const content = (data?.content?.[0]?.text ?? "").toString();
  return { content, usedModel: chosen };
}

function buildLLMPrompt(req: ProposeDiffRequest): string {
  const ctx = req.retrieved_context?.trim() ? `\n\nContext from repository (may include related patterns):\n${req.retrieved_context}` : "";
  return (
    `Instruction:\n${req.user_instruction}\n\n` +
    `Current file path: ${req.file_path}\n\n` +
    `Current file content (between BEGIN/END):\n` +
    `----- BEGIN ORIGINAL FILE -----\n${req.original_content}\n----- END ORIGINAL FILE -----\n` +
    `${ctx}\n\n` +
    `Return ONLY the full, final file content with the requested changes applied. No prose, no markdown, no diff.\n`
  );
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization,content-type",
          "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Require JWT (Supabase client will pass user session)
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body: ProposeDiffRequest = await req.json();
    const filePath = body.file_path?.trim();
    const original = normalizeNewlines(body.original_content ?? "");
    const instruction = body.user_instruction?.trim();

    if (!filePath || !instruction) {
      return new Response(JSON.stringify({ error: "file_path and user_instruction are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let newContent = original;
    let provider: "anthropic" | "openai" | "local" = "local";
    let usedModel: string | undefined;

    // Decide provider priority
    const want = (body.provider || "auto").toLowerCase();
    const hasAnthropic = !!Deno.env.get("ANTHROPIC_API_KEY");
    const hasOpenAI = !!Deno.env.get("OPENAI_API_KEY");
    const prompt = buildLLMPrompt(body);

    async function tryAnthropic() {
      const { content, usedModel: m } = await proposeWithAnthropic(prompt, body.model);
      const stripped = content.replace(/^```[a-zA-Z]*\n?/g, "").replace(/```\s*$/g, "").trim();
      if (stripped.length > 0) {
        newContent = normalizeNewlines(stripped);
        provider = "anthropic";
        usedModel = m;
        return true;
      }
      return false;
    }

    async function tryOpenAI() {
      const { content: llmOut, usedModel: m } = await proposeWithOpenAI(prompt, body.model);
      const stripped = llmOut.replace(/^```[a-zA-Z]*\n?/g, "").replace(/```\s*$/g, "").trim();
      if (stripped.length > 0) {
        newContent = normalizeNewlines(stripped);
        provider = "openai";
        usedModel = m;
        return true;
      }
      return false;
    }

    try {
      if (want === "anthropic" && hasAnthropic) {
        await tryAnthropic();
      } else if (want === "openai" && hasOpenAI) {
        await tryOpenAI();
      } else if (want === "auto") {
        if (hasAnthropic) {
          const ok = await tryAnthropic().catch(() => false);
          if (!ok && hasOpenAI) {
            await tryOpenAI().catch(() => {});
          }
        } else if (hasOpenAI) {
          await tryOpenAI().catch(() => {});
        }
      }
    } catch (_) {
      // Provider failure: remain on local fallback
    }

    // Compute a unified diff (original vs newContent)
    const diff = createUnifiedPatch(filePath, original, newContent);
    const changed = original !== newContent;

    const resp: ProposeDiffResponse = {
      unified_diff: diff,
      file_path: filePath,
      changed,
      provider,
      model: usedModel,
    };

    return new Response(JSON.stringify(resp), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
