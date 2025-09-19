"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { SecureAIService } from "@/services/ai/SecureAIService";

/**
 * Lightweight usage/plan indicator.
 * - If not authenticated: shows "Free (Local AI)"
 * - If authenticated: shows "Signed in • Premium available"
 * - If a recent premium call was made, we can show daily usage if the edge function returns it.
 */
export function UsageBadge() {
  const [label, setLabel] = useState<string>("Free (Local AI)");
  const [sub, setSub] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        const isAuthed = !!data?.session?.user;
        if (!isAuthed) {
          setLabel("Free (Local AI)");
          setSub("");
          return;
        }
        // Authenticated: premium is available (keys are server-side)
        setLabel("Signed in");
        setSub("Premium available");

        // Optional: attempt a no-cost local call to confirm connectivity
        await SecureAIService.chat([
          { role: "user", content: "status" },
        ], "local");
      } catch {
        // keep defaults
      }
    };
    init();
  }, []);

  return (
    <div className="hidden md:flex items-center rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs gap-2">
      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      <span className="font-medium">{label}</span>
      {sub && <span className="text-muted-foreground">• {sub}</span>}
    </div>
  );
}
