import React, { useState, useRef } from 'react';

interface LaTeXEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  onEditorRef?: (ref: { insertAtCursor: (text: string) => void }) => void;
}

export function LaTeXEditor({ initialContent, onChange, onSave, onEditorRef }: LaTeXEditorProps) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Update internal content when external content changes
  React.useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);
  
  // Expose insert method to parent
  React.useEffect(() => {
    if (onEditorRef) {
      onEditorRef({
        insertAtCursor: (text: string) => {
          const textarea = textareaRef.current;
          if (!textarea) return;
          
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newContent = content.slice(0, start) + '\n\n' + text + content.slice(end);
          
          handleContentChange(newContent);
          
          // Set cursor position after the inserted text
          setTimeout(() => {
            const newPos = start + text.length + 2; // +2 for \n\n
            textarea.setSelectionRange(newPos, newPos);
            textarea.focus();
          }, 0);
        }
      });
    }
  }, [content, onEditorRef]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onChange(newContent);
  };

  const insertCommand = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    
    const newContent = 
      content.slice(0, start) + 
      before + selectedText + after + 
      content.slice(end);
    
    handleContentChange(newContent);
    
    // Set cursor position after the inserted command
    setTimeout(() => {
      const newPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    }
    
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = 
        content.slice(0, start) + '  ' + content.slice(end);
      
      handleContentChange(newContent);
      
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  };

  return (
    <div className="latex-editor border border-gray-300 rounded-lg overflow-hidden">
      <div className="toolbar bg-gray-50 border-b border-gray-300 p-3 flex flex-wrap gap-2">
        <div className="flex gap-1">
          <button
            onClick={() => insertCommand('\\textbf{', '}')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-bold"
            title="Bold text"
          >
            B
          </button>
          <button
            onClick={() => insertCommand('\\textit{', '}')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm italic"
            title="Italic text"
          >
            I
          </button>
          <button
            onClick={() => insertCommand('\\underline{', '}')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm underline"
            title="Underline text"
          >
            U
          </button>
        </div>

        <div className="h-6 w-px bg-gray-300"></div>

        <div className="flex gap-1">
          <button
            onClick={() => insertCommand('\\begin{itemize}\\n  \\item ', '\\n\\end{itemize}')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
            title="Bullet list"
          >
            • List
          </button>
          <button
            onClick={() => insertCommand('\\begin{enumerate}\\n  \\item ', '\\n\\end{enumerate}')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
            title="Numbered list"
          >
            1. List
          </button>
        </div>

        <div className="h-6 w-px bg-gray-300"></div>

        <div className="flex gap-1">
          <button
            onClick={() => insertCommand('\\section{', '}')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
            title="Section"
          >
            Section
          </button>
          <button
            onClick={() => insertCommand('\\subsection{', '}')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
            title="Subsection"
          >
            Subsection
          </button>
          <button
            onClick={() => insertCommand('\\subsubsection{', '}')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
            title="Subsubsection"
          >
            Subsubsection
          </button>
        </div>

        <div className="h-6 w-px bg-gray-300"></div>

        <div className="flex gap-1">
          <button
            onClick={() => insertCommand('\\\\\\n', '')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
            title="Line break"
          >
            Break
          </button>
          <button
            onClick={() => insertCommand('% ', '')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm"
            title="Comment"
          >
            Comment
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full h-96 p-4 border border-gray-300 rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
        style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', lineHeight: '1.6' }}
        placeholder="Enter your LaTeX content here..."
        spellCheck={false}
      />

      <div className="bg-gray-50 border-t border-gray-300 px-3 py-2 text-xs text-gray-500">
        Press Ctrl/Cmd + S to save • Tab for indent • {content.split('\n').length} lines
      </div>
    </div>
  );
}