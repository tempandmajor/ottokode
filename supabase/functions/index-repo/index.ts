// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: index-repo
// Modes:
// - files: accepts an array of { path, content } and indexes them
// Future:
// - github: fetch a repository zipball by repo/ref and index (TODO)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const DEFAULT_DIM = 1536;

interface FileInput { path: string; content: string }
interface IndexRequest {
  mode?: "files" | "github";
  files?: FileInput[];
  repo?: string; // e.g. "owner/name"
  ref?: string; // e.g. "main"
  filterPath?: string | null;
}

function normalizeSpaces(s: string) {
  return s.replace(/[\s\u00A0]+/g, " ").trim();
}

function chunkText(text: string, maxChars = 2000): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + maxChars, text.length);
    chunks.push(text.slice(i, end));
    i = end;
  }
  return chunks;
}

async function embedText(text: string): Promise<number[]> {
  const normalized = normalizeSpaces(text);
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: normalized, model: "text-embedding-3-small" }),
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(`OpenAI embeddings HTTP ${res.status}: ${msg}`);
    }
    const data = await res.json();
    const vec: number[] | undefined = data?.data?.[0]?.embedding;
    if (!Array.isArray(vec)) throw new Error("Invalid embeddings response");
    return vec;
  }
  // Dummy local embedding (deterministic; dev only)
  const arr = new Array<number>(DEFAULT_DIM).fill(0);
  let h = 0;
  for (let i = 0; i < normalized.length; i++) {
    h = (h * 31 + normalized.charCodeAt(i)) >>> 0;
    arr[i % DEFAULT_DIM] = (arr[i % DEFAULT_DIM] + (h % 1000)) / 2;
  }
  const max = Math.max(...arr.map((v) => Math.abs(v)), 1);
  return arr.map((v) => v / max);
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Admin check (simple): require authenticated user with an allowlist email domain or admin claim.
    // In production, replace with robust org policy checks.
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response(JSON.stringify({ error: "Server not configured (SUPABASE_URL or SERVICE key missing)" }), { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: auth } },
    });

    // Admin enforcement: require authenticated user and either ADMIN_DOMAIN match or users.is_admin flag
    const { data: userData, error: userErr } = await (supabase.auth as any).getUser?.();
    if (userErr || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized (no user)" }), { status: 401 });
    }
    const email: string = userData.user.email as string;
    const ADMIN_DOMAIN = Deno.env.get("ADMIN_DOMAIN");
    let isAdmin = false;
    if (ADMIN_DOMAIN && email.toLowerCase().endsWith(`@${ADMIN_DOMAIN.toLowerCase()}`)) {
      isAdmin = true;
    } else {
      const { data: urow } = await supabase
        .from("users")
        .select("id, email, is_admin")
        .eq("id", userData.user.id)
        .maybeSingle();
      if ((urow as any)?.is_admin === true) isAdmin = true;
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden (admin required)" }), { status: 403 });
    }

    const body: IndexRequest = await req.json().catch(() => ({} as any));
    const mode = body.mode ?? "files";

    const files: FileInput[] = [];
    if (mode === "files") {
      if (!Array.isArray(body.files) || body.files.length === 0) {
        return new Response(JSON.stringify({ error: "files[] required for mode=files" }), { status: 400 });
      }
      files.push(...body.files);
    } else if (mode === "github") {
      // TODO: implement zipball fetch and extraction for repo/ref
      return new Response(JSON.stringify({ error: "mode=github not yet implemented" }), { status: 501 });
    }

    let total = 0;
    for (const f of files) {
      const chunks = chunkText(f.content, 2000);
      const rows: any[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await embedText(chunks[i]);
        rows.push({ repo_path: body.filterPath ?? null, file_path: f.path, chunk_index: i, content: chunks[i], embedding });
      }
      // Delete existing embeddings for this file first, then insert new ones
      await supabase.from("ai_embeddings").delete().eq("file_path", f.path);
      const { error } = await supabase.from("ai_embeddings").insert(rows);
      if (error) throw error;
      total += rows.length;
    }

    try {
      await supabase.from("ai_index_status").insert({ last_commit: null }).catch(() => {});
    } catch (error) {
      // Ignore errors - this is just for tracking
    }

    return new Response(JSON.stringify({ ok: true, indexed_chunks: total }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
