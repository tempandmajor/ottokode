'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { SecureAIService } from '@/services/ai/SecureAIService';
import { retrieveSimilarChunks } from '@/services/context/retriever';
import { embedText } from '@/services/context/embedding';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  onMount?: (editor: any, monaco: any) => void;
  filePath?: string;
  onRefactorRequest?: (filePath: string, content: string, selectedText?: string) => void;
}

export function MonacoEditor({
  value,
  onChange,
  language = 'typescript',
  readOnly = false,
  onMount,
  filePath,
  onRefactorRequest
}: MonacoEditorProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Debounced AI completion provider (uses SecureAIService via Edge Function)
    const pendingRequests = new Map<string, AbortController>();
    let lastReqTime = 0;

    function getModelContext(model: any, position: any) {
      const lineNumber = position.lineNumber;
      const column = position.column;
      const text = model.getValue();
      const lines = text.split('\n');
      const before = lines.slice(0, lineNumber - 1).join('\n') + '\n' + lines[lineNumber - 1].slice(0, column - 1);
      const after = lines[lineNumber - 1].slice(column - 1) + '\n' + lines.slice(lineNumber).join('\n');
      // Truncate context to keep requests small
      const maxCtx = 4000;
      const left = before.slice(-Math.floor(maxCtx * 0.7));
      const right = after.slice(0, Math.floor(maxCtx * 0.3));
      return { before: left, after: right, language };
    }

    function toSnippet(text: string) {
      // Convert plain text into a Monaco snippet; escape $ and backticks
      const escaped = text.replace(/\$/g, '\\$').replace(/`/g, '\\`');
      return escaped;
    }

    monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ['.', ' ', '(', ')', '[', ']', '{', '}', '=', '>', '<', ':', ';', '\n'],
      provideCompletionItems: async (model: any, position: any) => {
        try {
          // Simple debounce: avoid spamming requests if typing rapidly
          const now = Date.now();
          if (now - lastReqTime < 200) {
            return { suggestions: [] };
          }
          lastReqTime = now;

          const ctx = getModelContext(model, position);

          // Cancel any pending request for this model
          const key = model.uri.toString();
          const prev = pendingRequests.get(key);
          if (prev) prev.abort();
          const controller = new AbortController();
          pendingRequests.set(key, controller);

          // Check if context-aware suggestions are enabled via feature flag
          const contextAware = process.env.NEXT_PUBLIC_CONTEXT_AWARE === '1';
          let contextChunks = '';

          if (contextAware) {
            try {
              // Generate embedding for current context to find similar code
              const queryText = ctx.before.slice(-500) + ' ' + ctx.after.slice(0, 500);
              const queryEmbedding = await embedText(queryText);

              // Retrieve top-3 similar chunks from the codebase
              const similarChunks = await retrieveSimilarChunks(queryEmbedding, 3);

              if (similarChunks.length > 0) {
                contextChunks = '\n\nSimilar code patterns from codebase:\n\n' +
                  similarChunks.map(chunk =>
                    `// From ${chunk.file_path}:\n${chunk.content.slice(0, 300)}...`
                  ).join('\n\n');
              }
            } catch (error) {
              console.warn('Context retrieval failed:', error);
            }
          }

          // Compose prompt with optional context
          const prompt = `Suggest the next few lines for this ${ctx.language} code. Only return code without explanations.${contextChunks}\n\nCurrent context:\n\nBefore:\n\n${ctx.before}\n\nAfter (future context for alignment):\n\n${ctx.after}`;

          const result = await SecureAIService.chat([
            { role: 'system', content: `You are a code completion engine. ${contextAware ? 'Use the provided codebase patterns to suggest contextually relevant completions. ' : ''}Return only code without backticks.` },
            { role: 'user', content: prompt }
          ], 'local', { max_tokens: 128, temperature: 0.2 });

          if (controller.signal.aborted) return { suggestions: [] };
          const text = (result?.text || '').trim();
          if (!text) return { suggestions: [] };

          const item = {
            label: 'AI completion',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: toSnippet(text),
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          };
          return { suggestions: [item] };
        } catch (e) {
          return { suggestions: [] };
        }
      }
    });

    // Configure custom theme for AI styling
    monaco.editor.defineTheme('ai-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: '8B5CF6' },
        { token: 'string', foreground: '10B981' },
        { token: 'number', foreground: 'F59E0B' },
        { token: 'type', foreground: '06B6D4' },
        { token: 'function', foreground: 'F97316' }
      ],
      colors: {
        'editor.background': '#0F0F0F',
        'editor.foreground': '#F3F4F6',
        'editor.lineHighlightBackground': '#1F2937',
        'editor.selectionBackground': '#374151',
        'editorCursor.foreground': '#8B5CF6',
        'editorLineNumber.foreground': '#6B7280',
        'editorLineNumber.activeForeground': '#8B5CF6'
      }
    });

    monaco.editor.defineTheme('ai-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7C3AED' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'D97706' },
        { token: 'type', foreground: '0891B2' },
        { token: 'function', foreground: 'EA580C' }
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#1F2937',
        'editor.lineHighlightBackground': '#F9FAFB',
        'editor.selectionBackground': '#E5E7EB',
        'editorCursor.foreground': '#7C3AED',
        'editorLineNumber.foreground': '#9CA3AF',
        'editorLineNumber.activeForeground': '#7C3AED'
      }
    });

    // Set theme based on current theme
    const editorTheme = theme === 'dark' ? 'ai-dark' : 'ai-light';
    monaco.editor.setTheme(editorTheme);

    // Add context menu action for AI refactoring
    if (onRefactorRequest && filePath && !readOnly) {
      editor.addAction({
        id: 'ai-refactor',
        label: '🧠 Ask AI to refactor (Beta)',
        contextMenuGroupId: 'modification',
        contextMenuOrder: 1.5,
        run: (editor: any) => {
          const selection = editor.getSelection();
          const selectedText = selection && !selection.isEmpty()
            ? editor.getModel()?.getValueInRange(selection)
            : undefined;

          onRefactorRequest(filePath, editor.getValue(), selectedText);
        }
      });
    }

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: '"Fira Code", "Cascadia Code", monospace',
      fontLigatures: true,
      lineHeight: 1.6,
      minimap: {
        enabled: true,
        scale: 0.8
      },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      parameterHints: {
        enabled: true,
        cycle: true
      },
      hover: {
        enabled: true,
        delay: 300
      }
    });

    if (onMount) {
      onMount(editor, monaco);
    }
  };

  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={(value) => onChange(value || '')}
      onMount={handleEditorDidMount}
      theme={theme === 'dark' ? 'ai-dark' : 'ai-light'}
      options={{
        readOnly,
        fontSize: 14,
        fontFamily: '"Fira Code", "Cascadia Code", monospace',
        fontLigatures: true,
        lineHeight: 1.6,
        minimap: { enabled: true, scale: 0.8 },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        padding: { top: 16, bottom: 16 }
      }}
    />
  );
}