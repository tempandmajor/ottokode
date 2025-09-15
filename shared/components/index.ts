// Shared Components Export
// This file exports components that can be used in both desktop and web versions

// Editor Components
export { CodeEditor } from '../../src/components/editor/CodeEditor';
export { FileExplorer } from '../../src/components/editor/FileExplorer';
export type { FileSystemItem } from '../../src/components/editor/FileExplorer';

// AI Components
export { AIChat } from '../../src/components/ai/AIChat';

// Settings Components
export { AISettings } from '../../src/components/settings/AISettings';

// Re-export types for TypeScript
export type {
  AIMessage,
  AIProvider,
  AICompletionOptions,
  AICompletionResponse,
  AICodeSuggestion,
  AIProviderConfig
} from '../../src/services/ai/AIService';

// Platform-specific component factories
export const createPlatformComponents = (platform: 'desktop' | 'web') => {
  // Return platform-specific implementations
  return {
    FileSystem: platform === 'desktop'
      ? () => import('../../src/services/filesystem/FileSystemService')
      : () => import('./web/WebFileSystemService'),

    Auth: platform === 'desktop'
      ? () => import('../../src/services/auth/DesktopAuthService')
      : () => import('./web/WebAuthService'),
  };
};