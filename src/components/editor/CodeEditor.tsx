import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Editor, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { APP_CONFIG } from '../../constants/app';

interface CodeEditorProps {
  file?: {
    path: string;
    content: string;
    language: string;
  };
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  onCursorChange?: (position: { line: number; column: number }) => void;
  readOnly?: boolean;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
  collaborators?: Array<{
    id: string;
    name: string;
    color: string;
    cursor?: { line: number; column: number };
    selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number };
  }>;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  onChange,
  onSave,
  onCursorChange,
  readOnly = false,
  theme = 'vs-dark',
  collaborators = []
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorDidMount = useCallback((editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editorInstance;
    monacoRef.current = monaco;
    setIsLoading(false);

    // Configure editor
    editorInstance.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      minimap: { enabled: true },
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      renderLineHighlight: 'all',
      selectOnLineNumbers: true,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true,
    });

    // Add AI-powered features
    setupAIFeatures(editorInstance, monaco);

    // Add keyboard shortcuts
    setupKeyboardShortcuts(editorInstance);

    // Track cursor changes
    editorInstance.onDidChangeCursorPosition((e) => {
      const position = e.position;
      onCursorChange?.({ line: position.lineNumber, column: position.column });
    });

    // Track content changes
    editorInstance.onDidChangeModelContent(() => {
      const content = editorInstance.getValue();
      onChange?.(content);
    });

  }, [onChange, onCursorChange]);

  const setupAIFeatures = (editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    // Register AI completion provider
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: async (model, position) => {
        // TODO: Integrate with AI providers for intelligent code completion
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        return {
          suggestions: [
            {
              label: 'AI_SUGGESTION',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'function ${1:name}(${2:params}) {\n\t${3}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: range,
              detail: 'AI-generated function',
              documentation: 'Smart function completion powered by AI'
            }
          ]
        };
      }
    });

    // Register hover provider for AI explanations
    monaco.languages.registerHoverProvider('javascript', {
      provideHover: async (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `**AI Explanation for "${word.word}"**` },
            { value: 'This would show AI-powered code explanations' }
          ]
        };
      }
    });
  };

  const setupKeyboardShortcuts = (editorInstance: editor.IStandaloneCodeEditor) => {
    // Save shortcut
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const content = editorInstance.getValue();
      onSave?.(content);
    });

    // AI chat shortcut
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyA, () => {
      // TODO: Open AI chat panel
      console.log('AI chat shortcut triggered');
    });

    // Format document
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editorInstance.trigger('', 'editor.action.formatDocument', {});
    });
  };

  // Update collaborator cursors and selections
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const decorations: editor.IModelDeltaDecoration[] = [];

    collaborators.forEach((collaborator) => {
      if (collaborator.cursor) {
        // Add cursor decoration
        decorations.push({
          range: new monacoRef.current!.Range(
            collaborator.cursor.line,
            collaborator.cursor.column,
            collaborator.cursor.line,
            collaborator.cursor.column
          ),
          options: {
            className: 'collaborator-cursor',
            glyphMarginClassName: 'collaborator-glyph',
            stickiness: editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            after: {
              content: collaborator.name,
              inlineClassName: 'collaborator-label',
              color: collaborator.color,
            }
          }
        });
      }

      if (collaborator.selection) {
        // Add selection decoration
        decorations.push({
          range: new monacoRef.current!.Range(
            collaborator.selection.startLine,
            collaborator.selection.startColumn,
            collaborator.selection.endLine,
            collaborator.selection.endColumn
          ),
          options: {
            className: 'collaborator-selection',
            stickiness: editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          }
        });
      }
    });

    // Apply decorations
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, decorations);
  }, [collaborators]);

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'clj': 'clojure',
      'hs': 'haskell',
      'ml': 'ocaml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'vue': 'vue',
      'svelte': 'svelte',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'cfg': 'ini',
      'conf': 'ini',
      'env': 'shell',
      'md': 'markdown',
      'txt': 'plaintext'
    };

    return languageMap[extension || ''] || 'plaintext';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading {APP_CONFIG.name} Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <Editor
        height="100%"
        language={file ? getLanguageFromPath(file.path) : 'javascript'}
        value={file?.content || '// Welcome to Branchcode AI\n// Start coding with AI assistance\n\nfunction hello() {\n  console.log("Hello, World!");\n}'}
        onChange={(value) => onChange?.(value || '')}
        onMount={handleEditorDidMount}
        theme={theme}
        options={{
          readOnly,
          selectOnLineNumbers: true,
          roundedSelection: false,
          cursorStyle: 'line',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          wrappingIndent: 'indent',
          fontFamily: '"Cascadia Code", "Fira Code", "Consolas", "Monaco", monospace',
          fontLigatures: true,
          renderLineHighlight: 'all',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: true,
        }}
      />

      {/* Collaboration indicators */}
      {collaborators.length > 0 && (
        <div className="absolute top-2 right-2 flex space-x-2">
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className="flex items-center space-x-1 bg-gray-800 rounded-full px-2 py-1 text-xs text-white"
              style={{ borderLeft: `3px solid ${collaborator.color}` }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: collaborator.color }}
              />
              <span>{collaborator.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-800 text-white text-xs px-4 py-1 flex justify-between items-center">
        <div className="flex space-x-4">
          <span>{file ? getLanguageFromPath(file.path).toUpperCase() : 'JAVASCRIPT'}</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div className="flex space-x-4">
          <span>Ln 1, Col 1</span>
          <span>{APP_CONFIG.name}</span>
        </div>
      </div>

      {/* AI suggestions overlay */}
      <style jsx>{`
        .collaborator-cursor {
          background-color: transparent;
          border-left: 2px solid;
          border-right: 2px solid;
          border-color: inherit;
        }

        .collaborator-selection {
          background-color: rgba(0, 122, 204, 0.15);
          border: 1px solid rgba(0, 122, 204, 0.3);
        }

        .collaborator-label {
          background-color: inherit;
          color: white;
          padding: 2px 4px;
          border-radius: 2px;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
        }

        .collaborator-glyph {
          background-color: inherit;
          width: 3px;
        }
      `}</style>
    </div>
  );
};