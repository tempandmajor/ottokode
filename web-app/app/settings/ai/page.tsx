"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AISettingsService, defaultAISettings } from "@/services/ai/AISettingsService";
import type { ProviderPref } from "@/services/ai/PatchService";

const OPENAI_PRESETS = [
  { id: "gpt-5-nano", note: "cost-efficient (default)" },
  { id: "gpt-5-mini", note: "mid-tier" },
  { id: "gpt-5", note: "highest quality" },
  { id: "gpt-4o", note: "previous gen" },
  { id: "gpt-4o-mini", note: "previous gen (cost-efficient)" }
];

const ANTHROPIC_PRESETS = [
  { id: "claude-4-sonnet", note: "balanced (default)" },
  { id: "claude-4-opus", note: "highest quality" },
  { id: "claude-3-5-sonnet-20241022", note: "previous gen" },
  { id: "claude-3-5-haiku-20241022", note: "cost-efficient" }
];

export default function AISettingsPage() {
  const [provider, setProvider] = useState<ProviderPref | "auto">(defaultAISettings.provider as ProviderPref | "auto");
  const [model, setModel] = useState<string>(defaultAISettings.model || "");
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    const current = AISettingsService.getSettings();
    setProvider((current.provider as ProviderPref) || "auto");
    setModel(current.model || "");
  }, []);

  function save() {
    AISettingsService.saveSettings({ provider, model });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function applyPreset(p: string) {
    setModel(p);
  }

  const presets = provider === "openai" ? OPENAI_PRESETS : ANTHROPIC_PRESETS;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Settings</h1>
        <p className="text-muted-foreground mt-2">
          Choose your AI provider and model. These settings affect code refactor proposals and (optionally) completions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider & Model</CardTitle>
          <CardDescription>Pick a provider, then choose a preset or enter a custom model name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="provider">Provider</Label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <Button variant={provider === "auto" ? "default" : "outline"} onClick={() => setProvider("auto")}>Auto</Button>
                <Button variant={provider === "anthropic" ? "default" : "outline"} onClick={() => setProvider("anthropic")}>Anthropic</Button>
                <Button variant={provider === "openai" ? "default" : "outline"} onClick={() => setProvider("openai")}>OpenAI</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Auto prefers Anthropic and falls back to OpenAI. You can override with a specific provider.
              </p>
            </div>

            <div>
              <Label htmlFor="model">Model</Label>
              <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder={provider === "openai" ? "e.g. gpt-5-nano" : "e.g. claude-4-sonnet"} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-2">Enter a custom model or pick a preset below.</p>
            </div>
          </div>

          <div>
            <Label>Presets ({provider === "openai" ? "OpenAI" : "Anthropic"})</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
              {presets.map(p => (
                <Button key={p.id} variant="outline" onClick={() => applyPreset(p.id)} className="justify-between">
                  <span>{p.id}</span>
                  <span className="text-xs text-muted-foreground">{p.note}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={save}>Save Settings</Button>
            {saved && <span className="text-sm text-emerald-500">Saved</span>}
          </div>

          <div className="pt-2 text-xs text-muted-foreground">
            Relative cost guidance: cost-efficient &lt; mid-tier &lt; highest quality. See provider docs for current pricing.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
