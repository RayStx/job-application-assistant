import React, { useState } from 'react';

interface SectionEditorProps {
  content: string;
  onChange: (content: string) => void;
  onClose: () => void;
}

interface ParsedSection {
  type: 'section' | 'datedsubsection' | 'text' | 'itemize' | 'enumerate';
  title?: string;
  content: string;
  rawLatex: string;
  startIndex: number;
  endIndex: number;
}

export function SectionEditor({ content, onChange, onClose }: SectionEditorProps) {
  const [sections, setSections] = useState<ParsedSection[]>(() => parseContent(content));
  const [selectedSection, setSelectedSection] = useState<ParsedSection | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  // Parse LaTeX content into manageable sections
  function parseContent(latex: string): ParsedSection[] {
    const parsed: ParsedSection[] = [];
    let currentIndex = 0;
    
    // Find sections
    const sectionRegex = /\\section\{([^}]+)\}/g;
    let match;
    
    while ((match = sectionRegex.exec(latex)) !== null) {
      const title = match[1];
      const sectionStart = match.index;
      const nextSection = latex.indexOf('\\section{', sectionStart + 1);
      const sectionEnd = nextSection === -1 ? latex.length : nextSection;
      const sectionContent = latex.slice(sectionStart, sectionEnd);
      
      parsed.push({
        type: 'section',
        title,
        content: extractPlainText(sectionContent),
        rawLatex: sectionContent,
        startIndex: sectionStart,
        endIndex: sectionEnd
      });
    }
    
    // If no sections found, treat as single text block
    if (parsed.length === 0) {
      parsed.push({
        type: 'text',
        content: extractPlainText(latex),
        rawLatex: latex,
        startIndex: 0,
        endIndex: latex.length
      });
    }
    
    return parsed;
  }

  // Extract plain text from LaTeX, removing commands but keeping content
  function extractPlainText(latex: string): string {
    return latex
      // Remove LaTeX commands but keep their content
      .replace(/\\textbf\{([^}]+)\}/g, '**$1**')
      .replace(/\\textit\{([^}]+)\}/g, '*$1*')
      .replace(/\\underline\{([^}]+)\}/g, '_$1_')
      .replace(/\\section\{([^}]+)\}/g, '# $1')
      .replace(/\\subsection\{([^}]+)\}/g, '## $1')
      .replace(/\\datedsubsection\{([^}]+)\}\{([^}]+)\}/g, '$1 ($2)')
      // Handle lists
      .replace(/\\begin\{itemize\}/g, '')
      .replace(/\\end\{itemize\}/g, '')
      .replace(/\\begin\{enumerate\}/g, '')
      .replace(/\\end\{enumerate\}/g, '')
      .replace(/\\item\s+/g, '• ')
      // Remove remaining LaTeX commands
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
      .replace(/\\[a-zA-Z]+/g, '')
      // Clean up whitespace
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  // Convert plain text back to LaTeX
  function convertToLatex(plainText: string, originalSection: ParsedSection): string {
    let latex = plainText
      // Convert markdown-style formatting back to LaTeX
      .replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}')
      .replace(/\*([^*]+)\*/g, '\\textit{$1}')
      .replace(/_([^_]+)_/g, '\\underline{$1}')
      .replace(/^# (.+)$/gm, '\\section{$1}')
      .replace(/^## (.+)$/gm, '\\subsection{$1}')
      .replace(/^• (.+)$/gm, '\\item $1');
    
    // If original was a section, wrap appropriately
    if (originalSection.type === 'section' && originalSection.title) {
      if (!latex.startsWith('\\section{')) {
        latex = `\\section{${originalSection.title}}\n\n${latex}`;
      }
    }
    
    // Handle itemize lists
    const lines = latex.split('\n');
    let inList = false;
    const processedLines: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('\\item ')) {
        if (!inList) {
          processedLines.push('\\begin{itemize}');
          inList = true;
        }
        processedLines.push(`  ${line}`);
      } else {
        if (inList) {
          processedLines.push('\\end{itemize}');
          inList = false;
        }
        processedLines.push(line);
      }
    }
    
    if (inList) {
      processedLines.push('\\end{itemize}');
    }
    
    return processedLines.join('\n');
  }

  const startEditing = (section: ParsedSection) => {
    setSelectedSection(section);
    setEditText(section.content);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!selectedSection) return;
    
    const newLatex = convertToLatex(editText, selectedSection);
    const newContent = content.slice(0, selectedSection.startIndex) + 
                      newLatex + 
                      content.slice(selectedSection.endIndex);
    
    onChange(newContent);
    setIsEditing(false);
    setSelectedSection(null);
    setSections(parseContent(newContent));
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedSection(null);
    setEditText('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Section Editor</h2>
              <p className="text-sm text-gray-600">Edit content as plain text without LaTeX syntax</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex h-[70vh]">
          {/* Section List */}
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium">Sections</h3>
            </div>
            <div className="overflow-y-auto h-full">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    selectedSection === section ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedSection(section)}
                >
                  <h4 className="font-medium text-sm">
                    {section.title || `${section.type} ${index + 1}`}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {section.content.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Content Editor */}
          <div className="flex-1 flex flex-col">
            {selectedSection ? (
              <>
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {selectedSection.title || `${selectedSection.type} Content`}
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={() => startEditing(selectedSection)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit as Plain Text
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-4">
                  {isEditing ? (
                    <div className="h-full flex flex-col">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 w-full p-3 border border-gray-300 rounded font-mono text-sm resize-none"
                        placeholder="Edit your content here using plain text..."
                      />
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full overflow-auto">
                      <div className="bg-gray-50 p-4 rounded border">
                        <h4 className="font-medium mb-2">Plain Text Preview:</h4>
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {selectedSection.content}
                        </pre>
                      </div>
                      <div className="bg-gray-900 text-gray-100 p-4 rounded border mt-4">
                        <h4 className="font-medium mb-2 text-gray-300">LaTeX Source:</h4>
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {selectedSection.rawLatex}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Select a Section</h3>
                  <p>Choose a section from the left to edit as plain text</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            <p><strong>Tip:</strong> Use **bold**, *italic*, _underline_ for formatting. Use • for bullet points.</p>
            <p>Changes are automatically converted back to LaTeX when saved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}