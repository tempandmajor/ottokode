import { AISettings } from "@/components/ai/AISettings";
import { ProviderPref } from "./PatchService";

const AI_SETTINGS_KEY = "ai-settings";

export const defaultAISettings: AISettings = {
  provider: "auto",
  model: "claude-4-sonnet"
};

export class AISettingsService {
  static getSettings(): AISettings {
    if (typeof window === "undefined") {
      return defaultAISettings;
    }

    try {
      const stored = localStorage.getItem(AI_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          provider: parsed.provider || defaultAISettings.provider,
          model: parsed.model || defaultAISettings.model
        };
      }
    } catch (error) {
      console.warn("Failed to load AI settings from localStorage:", error);
    }

    return defaultAISettings;
  }

  static saveSettings(settings: AISettings): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn("Failed to save AI settings to localStorage:", error);
    }
  }

  static getEffectiveProviderAndModel(settings?: AISettings): { provider?: ProviderPref; model?: string } {
    const currentSettings = settings || this.getSettings();

    if (currentSettings.provider === "auto") {
      return {
        provider: "auto",
        model: undefined
      };
    }

    return {
      provider: currentSettings.provider,
      model: currentSettings.model || undefined
    };
  }
}