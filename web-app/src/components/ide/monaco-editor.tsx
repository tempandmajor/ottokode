'use client';

import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  onMount?: (editor: any, monaco: any) => void;
}

export function MonacoEditor({
  value,
  onChange,
  language = 'typescript',
  readOnly = false,
  onMount
}: MonacoEditorProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Configure AI-powered suggestions
    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: (model: any, position: any) => {
        const suggestions = [
          {
            label: 'console.log',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'console.log(${1:value});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Log a value to the console'
          },
          {
            label: 'function',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'function ${1:name}(${2:params}) {\n\t${3:// AI suggestion: Add function body}\n\treturn ${4:value};\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Create a new function with AI-powered suggestions'
          },
          {
            label: 'async function',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'async function ${1:name}(${2:params}) {\n\ttry {\n\t\t${3:// AI suggestion: Add async logic here}\n\t\treturn await ${4:promise};\n\t} catch (error) {\n\t\tconsole.error("Error in ${1:name}:", error);\n\t\tthrow error;\n\t}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Create an async function with error handling'
          },
          {
            label: 'React component',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'interface ${1:ComponentName}Props {\n\t${2:// Add props here}\n}\n\nexport function ${1:ComponentName}({ ${3:props} }: ${1:ComponentName}Props) {\n\treturn (\n\t\t<div className="${4:styling}">\n\t\t\t${5:// Component content}\n\t\t</div>\n\t);\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Create a typed React component'
          }
        ];

        return { suggestions };
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