import React, { useState } from 'react';
import { SectionStorage } from '@/lib/storage/sectionStorage';
import type { ResumeSection } from '@/types';

interface SectionVersionEditorProps {
  section: ResumeSection;
  onClose: () => void;
  onSave?: () => void;
}

export function SectionVersionEditor({ section, onClose, onSave }: SectionVersionEditorProps) {
  const [title, setTitle] = useState(section.title);
  const [content, setContent] = useState(section.content);
  const [tags, setTags] = useState(section.tags.join(', '));
  const [versionNote, setVersionNote] = useState('');

  const convertToLatex = (plainText: string): string => {
    let latex = plainText
      .replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}')
      .replace(/\*([^*]+)\*/g, '\\textit{$1}')
      .replace(/_([^_]+)_/g, '\\underline{$1}')
      .replace(/^# (.+)$/gm, '\\section{$1}')
      .replace(/^## (.+)$/gm, '\\subsection{$1}')
      .replace(/^• (.+)$/gm, '\\item $1');
    
    // Handle lists
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
    
    // Handle specific section types
    if (section.type === 'education') {
      // Format as datedsubsection if not already
      if (!latex.includes('\\datedsubsection')) {
        const lines = latex.split('\n').filter(l => l.trim());
        if (lines.length >= 2) {
          latex = `\\datedsubsection{${lines[0]}}{${lines[1]}}\\n\\n${lines.slice(2).join('\\n')}`;
        }
      }
    } else if (section.type === 'experience') {
      // Format as datedsubsection with itemize if not already
      if (!latex.includes('\\datedsubsection')) {
        const lines = latex.split('\n').filter(l => l.trim());
        if (lines.length >= 2) {
          const items = lines.slice(2).filter(l => l.includes('\\item')).join('\\n  ');
          latex = `\\datedsubsection{${lines[0]}}{${lines[1]}}\\n\\begin{itemize}\\n  ${items}\\n\\end{itemize}`;
        }
      }
    }
    
    return latex;
  };

  const saveNewVersion = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const sectionStorage = new SectionStorage();
      const latexContent = convertToLatex(content);
      
      const newVersion: ResumeSection = {
        id: crypto.randomUUID(),
        type: section.type,
        title: title.trim(),
        content: content.trim(),
        latexContent,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        versionNumber: section.versionNumber + 1,
        parentId: section.id,
        isTemplate: false
      };

      await sectionStorage.saveSection(newVersion);
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Failed to save new version:', error);
      alert('Failed to save section version');
    }
  };

  const getSectionTypeIcon = (type: ResumeSection['type']) => {
    const icons = {
      education: '🎓',
      experience: '💼', 
      research: '🔬',
      skills: '⚡',
      achievements: '🏆',
      custom: '📝'
    };
    return icons[type];
  };

  const getSectionTypeLabel = (type: ResumeSection['type']) => {
    const labels = {
      education: '教育背景',
      experience: '实习经历',
      research: '研究内容',
      skills: '技能特长',
      achievements: '获奖情况',
      custom: '自定义'
    };
    return labels[type];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getSectionTypeIcon(section.type)}</span>
              <div>
                <h2 className="text-lg font-semibold">Edit Section</h2>
                <p className="text-sm text-gray-600">
                  Creating v{section.versionNumber + 1} of {getSectionTypeLabel(section.type)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Enter section title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <div className="text-xs text-gray-500 mb-2">
                Use **bold**, *italic*, _underline_ for formatting. Use • for bullet points.
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                placeholder="Enter your content here...\\n\\nExample for experience:\\n**Company Name** | Department, **Position**, City\\n2021-2022\\n\\n• Achievement with specific data\\n• Another accomplishment\\n• Technical contribution"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="tech, remote, startup (comma separated)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version Note
              </label>
              <input
                type="text"
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Brief description of changes (optional)"
              />
            </div>

            {/* Preview */}
            <div className="border border-gray-200 rounded">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-medium text-sm">LaTeX Preview</h4>
              </div>
              <pre className="p-4 text-xs font-mono bg-gray-900 text-gray-100 overflow-auto max-h-40">
                {convertToLatex(content)}
              </pre>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={saveNewVersion}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={!title.trim() || !content.trim()}
          >
            Save as v{section.versionNumber + 1}
          </button>
        </div>
      </div>
    </div>
  );
}