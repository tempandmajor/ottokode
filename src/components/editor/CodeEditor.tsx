import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Editor, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { APP_CONFIG } from '../../constants/app';
import { aiGuidelineChecker } from '../../../shared/src/services/ai-guideline-checker';
import { CodeAnalysisResult, GuidelineViolation } from '../../../shared/src/types/documentation-guide';

interface CodeEditorProps {
  file?: {
    path: string;
    content: string;
    language: string;
  };
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
  onCursorChange?: (position: { line: number; column: number }) => void;
  onAnalysisResult?: (result: CodeAnalysisResult) => void;
  readOnly?: boolean;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
  projectType?: string;
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
  onAnalysisResult,
  readOnly = false,
  theme = 'vs-dark',
  projectType,
  collaborators = []
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const decorationsRef = useRef<string[]>([]);
  const guidelineDecorationsRef = useRef<string[]>([]);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

      // Debounced guideline analysis
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      analysisTimeoutRef.current = setTimeout(() => {
        performGuidelineAnalysis(content);
      }, 1000); // 1 second debounce
    });

  }, [onChange, onCursorChange, projectType, file]);

  const performGuidelineAnalysis = async (content: string) => {
    if (!file || !projectType || !editorRef.current || !monacoRef.current) return;

    try {
      const result = await aiGuidelineChecker.analyzeCode({
        code: content,
        filePath: file.path,
        language: getLanguageFromPath(file.path),
        projectType,
        platformGuidelines: [] // Will be populated based on project type
      });

      // Update parent component with analysis result
      onAnalysisResult?.(result);

      // Add visual indicators for violations and suggestions
      updateGuidelineDecorations(result);
    } catch (error) {
      console.error('Guideline analysis failed:', error);
    }
  };

  const updateGuidelineDecorations = (result: CodeAnalysisResult) => {
    if (!editorRef.current || !monacoRef.current) return;

    const decorations: editor.IModelDeltaDecoration[] = [];

    // Add violation decorations
    result.violations.forEach((violation) => {
      if (violation.lineNumber) {
        decorations.push({
          range: new monacoRef.current!.Range(
            violation.lineNumber,
            1,
            violation.lineNumber,
            1
          ),
          options: {
            isWholeLine: true,
            className: 'guideline-violation-line',
            glyphMarginClassName: 'guideline-violation-glyph',
            hoverMessage: {
              value: `**${violation.title}**\n\n${violation.description}`
            },
            minimap: {
              color: '#ff6b6b',
              position: editor.MinimapPosition.Inline
            }
          }
        });
      }
    });

    // Add suggestion decorations
    result.suggestions.forEach((suggestion) => {
      if (suggestion.lineNumber) {
        decorations.push({
          range: new monacoRef.current!.Range(
            suggestion.lineNumber,
            1,
            suggestion.lineNumber,
            1
          ),
          options: {
            isWholeLine: false,
            className: 'guideline-suggestion-line',
            glyphMarginClassName: 'guideline-suggestion-glyph',
            hoverMessage: {
              value: `**💡 ${suggestion.title}**\n\n${suggestion.description}`
            },
            minimap: {
              color: '#51cf66',
              position: editor.MinimapPosition.Inline
            }
          }
        });
      }
    });

    // Apply guideline decorations
    guidelineDecorationsRef.current = editorRef.current.deltaDecorations(
      guidelineDecorationsRef.current,
      decorations
    );
  };

  const setupAIFeatures = (editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    // Register AI completion provider
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: async (model, position) => {
        // AI-powered code completion with context awareness
        const word = model.getWordUntilPosition(position);
        const context = model.getValueInRange({
          startLineNumber: Math.max(1, position.lineNumber - 5),
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        // Smart suggestions based on context
        const suggestions = [];

        // Function suggestions
        if (context.includes('function') || context.includes('const')) {
          suggestions.push({
            label: 'async function',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'async function ${1:name}(${2:params}) {\n\t${3}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'Async function',
            documentation: 'Create an async function'
          });
        }

        // Import suggestions
        if (position.column === 1 || context.trim().endsWith('\n')) {
          suggestions.push({
            label: 'import',
            kind: monaco.languages.CompletionItemKind.Module,
            insertText: 'import { ${1} } from \'${2}\';',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'ES6 Import',
            documentation: 'Import modules'
          });
        }

        // React component suggestions
        if (context.includes('React') || context.includes('jsx') || context.includes('tsx')) {
          suggestions.push({
            label: 'React Component',
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: 'const ${1:ComponentName} = () => {\n\treturn (\n\t\t<div>\n\t\t\t${2}\n\t\t</div>\n\t);\n};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'React functional component',
            documentation: 'Create a React functional component'
          });
        }

        return {
          suggestions: suggestions
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
      // Open AI chat panel with current selection as context
      const selection = editorInstance.getSelection();
      const selectedText = selection ? editorInstance.getModel()?.getValueInRange(selection) : '';

      // Emit event to open AI chat with context
      window.dispatchEvent(new CustomEvent('openAIChat', {
        detail: {
          context: selectedText,
          action: 'explain'
        }
      }));
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

        .guideline-violation-line {
          background-color: rgba(255, 107, 107, 0.1);
          border-left: 3px solid #ff6b6b;
        }

        .guideline-violation-glyph {
          background-color: #ff6b6b;
          width: 4px;
          border-radius: 2px;
        }

        .guideline-violation-glyph::before {
          content: '⚠';
          color: white;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .guideline-suggestion-line {
          background-color: rgba(81, 207, 102, 0.05);
          border-left: 2px solid #51cf66;
        }

        .guideline-suggestion-glyph {
          background-color: #51cf66;
          width: 3px;
          border-radius: 2px;
        }

        .guideline-suggestion-glyph::before {
          content: '💡';
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
      `}</style>
    </div>
  );
};