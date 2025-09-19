"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ExperimentalBadge } from "@/components/ui/experimental-badge";
import { ProviderPref } from "@/services/ai/PatchService";

export interface AISettings {
  provider: ProviderPref;
  model: string;
}

interface AISettingsProps {
  settings: AISettings;
  onSettingsChange: (settings: AISettings) => void;
}

const DEFAULT_MODELS = {
  anthropic: [
    "claude-4-sonnet",
    "claude-4-opus",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229"
  ],
  openai: [
    "gpt-5-nano",
    "gpt-5-mini",
    "gpt-5",
    "gpt-4o",
    "gpt-4o-mini"
  ],
  auto: []
};

export function AISettings({ settings, onSettingsChange }: AISettingsProps) {
  const [localModel, setLocalModel] = useState(settings.model);

  useEffect(() => {
    setLocalModel(settings.model);
  }, [settings.model]);

  const handleProviderChange = (provider: ProviderPref) => {
    const defaultModel = provider === "anthropic"
      ? "claude-4-sonnet"
      : provider === "openai"
      ? "gpt-5-nano"
      : "";

    onSettingsChange({
      provider,
      model: defaultModel
    });
  };

  const handleModelChange = (model: string) => {
    setLocalModel(model);
    onSettingsChange({
      ...settings,
      model
    });
  };

  const getModelSuggestions = () => {
    if (settings.provider === "auto") return [];
    return DEFAULT_MODELS[settings.provider] || [];
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI Settings
          <ExperimentalBadge variant="beta" />
        </CardTitle>
        <CardDescription>
          Configure your AI provider and model preferences for patch generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select value={settings.provider} onValueChange={handleProviderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (Anthropic first)</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {settings.provider !== "auto" && (
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            {getModelSuggestions().length > 0 ? (
              <Select value={localModel} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {getModelSuggestions().map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={localModel}
                onChange={(e) => handleModelChange(e.target.value)}
                placeholder="Enter model name"
              />
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {settings.provider === "auto" && (
            <p>Auto mode will try Anthropic first, then fallback to OpenAI if needed.</p>
          )}
          {settings.provider === "anthropic" && (
            <p>Recommended: claude-4-sonnet for balanced performance, claude-4-opus for highest quality.</p>
          )}
          {settings.provider === "openai" && (
            <p>Recommended: gpt-5-nano for cost efficiency, gpt-5 for highest quality.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}