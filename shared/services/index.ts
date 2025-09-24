// Shared Services Export
// Services that work across both desktop and web platforms

// AI Service (works in both environments)
export { aiService, AIService } from '../../src/services/ai/ResponsesAIService';
export type {
  AIProvider,
  AIMessage,
  AICompletionOptions,
  AICompletionResponse,
  AICodeSuggestion,
  AIProviderConfig
} from '../../src/types/ai';

// Constants
export { APP_CONFIG, ROUTES, STORAGE_KEYS } from '../../src/constants/app';

// Utility functions
export const createPlatformService = <T>(
  desktopImplementation: () => Promise<T>,
  webImplementation: () => Promise<T>
) => {
  const isDesktop = typeof window !== 'undefined' && '__TAURI__' in window;
  return isDesktop ? desktopImplementation() : webImplementation();
};

// Platform detection
export const getPlatform = (): 'desktop' | 'web' => {
  if (typeof window === 'undefined') return 'web'; // SSR
  return '__TAURI__' in window ? 'desktop' : 'web';
};

// Environment helpers
export const isDesktop = () => getPlatform() === 'desktop';
export const isWeb = () => getPlatform() === 'web';