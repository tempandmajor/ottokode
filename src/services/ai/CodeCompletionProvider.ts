import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { aiProviderService } from './AIProviderService';
import { CodeCompletionRequest } from '../../types/ai';
import { readDir } from '@tauri-apps/plugin-fs';

export class AICodeCompletionProvider implements monaco.languages.CompletionItemProvider {
  triggerCharacters = ['.', '(', ' ', '\n'];
  private projectFilesCache: string[] = [];
  private lastCacheUpdate = 0;
  private cacheExpiry = 60000; // Cache for 1 minute

  async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken
  ): Promise<monaco.languages.CompletionList | null> {
    try {
      // Skip if user is just navigating or no meaningful context
      if (context.triggerKind === monaco.languages.CompletionTriggerKind.TriggerCharacter &&
          context.triggerCharacter === ' ') {
        return null;
      }

      const code = model.getValue();
      const language = this.mapMonacoLanguageToProvider(model.getLanguageId());

      // Get current line and check if we should provide completions
      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineContent.substring(0, position.column - 1);

      // Skip if the line is too short or just whitespace
      if (textBeforeCursor.trim().length < 2) {
        return null;
      }

      // Get project context
      const filename = model.uri.path;

      const request: CodeCompletionRequest = {
        code,
        language,
        position: {
          line: position.lineNumber - 1, // Monaco uses 1-based, our API uses 0-based
          column: position.column - 1
        },
        context: {
          filename,
          projectFiles: await this.getProjectFiles(),
          imports: this.extractImports(code, language)
        }
      };

      // Use the default AI provider and model
      const providers = aiProviderService.getProviders();
      const defaultProvider = Array.from(providers.values()).find(p => p.isConfigured);

      if (!defaultProvider) {
        return null;
      }

      const models = defaultProvider.models.filter(m => m.capabilities.codeGeneration);
      if (models.length === 0) {
        return null;
      }

      const response = await aiProviderService.completeCode(
        defaultProvider.name,
        models[0].id,
        request
      );

      if (token.isCancellationRequested) {
        return null;
      }

      // Convert AI completions to Monaco completion items
      const completionItems: monaco.languages.CompletionItem[] = response.completions.map((completion, index) => ({
        label: `AI: ${completion.text.split('\n')[0].substring(0, 50)}${completion.text.length > 50 ? '...' : ''}`,
        kind: this.getCompletionKind(completion.type),
        detail: `AI Suggestion (${Math.round(completion.confidence * 100)}% confidence)`,
        documentation: {
          value: `**AI Generated Code Completion**\n\n\`\`\`${language}\n${completion.text}\n\`\`\``
        },
        insertText: completion.text,
        range: completion.range ? {
          startLineNumber: completion.range.start.line + 1,
          startColumn: completion.range.start.column + 1,
          endLineNumber: completion.range.end.line + 1,
          endColumn: completion.range.end.column + 1
        } : {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        sortText: `${1000 - Math.round(completion.confidence * 1000)}-${index}`, // Higher confidence = better sort order
        filterText: completion.text,
        command: {
          id: 'ai-completion-accepted',
          title: 'AI Completion Accepted'
        }
      }));

      return {
        suggestions: completionItems
      };

    } catch (error) {
      console.error('Error providing AI code completion:', error);
      return null;
    }
  }

  private mapMonacoLanguageToProvider(monacoLanguage: string): string {
    const mapping: Record<string, string> = {
      'typescript': 'typescript',
      'javascript': 'javascript',
      'python': 'python',
      'java': 'java',
      'csharp': 'csharp',
      'cpp': 'cpp',
      'c': 'c',
      'go': 'go',
      'rust': 'rust',
      'php': 'php',
      'ruby': 'ruby',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'dart': 'dart',
      'scala': 'scala',
      'shell': 'bash',
      'powershell': 'powershell',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'yaml': 'yaml',
      'xml': 'xml',
      'markdown': 'markdown'
    };

    return mapping[monacoLanguage] || monacoLanguage;
  }

  private getCompletionKind(type: string): monaco.languages.CompletionItemKind {
    switch (type) {
      case 'function':
        return monaco.languages.CompletionItemKind.Function;
      case 'multiline':
        return monaco.languages.CompletionItemKind.Snippet;
      case 'inline':
      default:
        return monaco.languages.CompletionItemKind.Text;
    }
  }

  private extractImports(code: string, language: string): string[] {
    const imports: string[] = [];

    try {
      const lines = code.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();

        switch (language) {
          case 'typescript':
          case 'javascript':
            if (trimmed.startsWith('import ') || trimmed.startsWith('const ') && trimmed.includes('require(')) {
              imports.push(trimmed);
            }
            break;
          case 'python':
            if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
              imports.push(trimmed);
            }
            break;
          case 'java':
            if (trimmed.startsWith('import ')) {
              imports.push(trimmed);
            }
            break;
          case 'go':
            if (trimmed.startsWith('import ')) {
              imports.push(trimmed);
            }
            break;
          case 'rust':
            if (trimmed.startsWith('use ')) {
              imports.push(trimmed);
            }
            break;
        }
      }
    } catch (error) {
      console.warn('Error extracting imports:', error);
    }

    return imports;
  }

  private async getProjectFiles(): Promise<string[]> {
    const now = Date.now();

    // Return cached files if not expired
    if (this.projectFilesCache.length > 0 && (now - this.lastCacheUpdate) < this.cacheExpiry) {
      return this.projectFilesCache;
    }

    try {
      // Get the current working directory from the project root
      const projectRoot = await this.findProjectRoot();
      if (!projectRoot) {
        return [];
      }

      const files = await this.scanDirectory(projectRoot);

      // Filter for relevant code files
      const codeExtensions = [
        '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs',
        '.php', '.rb', '.swift', '.kt', '.dart', '.scala', '.sh', '.ps1', '.sql',
        '.html', '.css', '.scss', '.json', '.yaml', '.yml', '.xml', '.md'
      ];

      this.projectFilesCache = files.filter(file =>
        codeExtensions.some(ext => file.toLowerCase().endsWith(ext))
      );

      this.lastCacheUpdate = now;
      return this.projectFilesCache;
    } catch (error) {
      console.warn('Error getting project files:', error);
      return [];
    }
  }

  private async findProjectRoot(): Promise<string | null> {
    try {
      // Look for common project indicators
      // const indicators = ['package.json', 'Cargo.toml', 'go.mod', 'requirements.txt', '.git'];
      const currentDir = '.'; // Start from current directory

      // For simplicity, assume current directory is project root
      // TODO: Implement proper project root detection by checking for indicator files
      return currentDir;
    } catch (error) {
      return null;
    }
  }

  private async scanDirectory(path: string, maxDepth: number = 3, currentDepth: number = 0): Promise<string[]> {
    const files: string[] = [];

    if (currentDepth >= maxDepth) {
      return files;
    }

    try {
      const entries = await readDir(path);

      for (const entry of entries) {
        if (entry.isFile) {
          files.push(entry.name);
        } else if (entry.isDirectory && !this.shouldIgnoreDirectory(entry.name)) {
          const subFiles = await this.scanDirectory(
            `${path}/${entry.name}`,
            maxDepth,
            currentDepth + 1
          );
          files.push(...subFiles.map(f => `${entry.name}/${f}`));
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory ${path}:`, error);
    }

    return files;
  }

  private shouldIgnoreDirectory(name: string): boolean {
    const ignoredDirs = [
      'node_modules', '.git', '.vscode', '.idea', 'dist', 'build', 'target',
      '__pycache__', '.pytest_cache', 'venv', 'env', '.env'
    ];
    return ignoredDirs.includes(name) || name.startsWith('.');
  }
}

export const aiCodeCompletionProvider = new AICodeCompletionProvider();