import React, { useState, useEffect } from 'react';
import { SectionStorage } from '@/lib/storage/sectionStorage';
import { DocumentDiff } from './DocumentDiff';
import { LaTeXEditor } from './LaTeXEditor';
import type { ResumeSection } from '@/types';

interface SectionLibraryProps {
  onSectionSelect?: (section: ResumeSection) => void;
  mode?: 'library' | 'selector';
  dataLanguage: 'zh' | 'en';
}

export function SectionLibrary({ onSectionSelect, mode = 'library', dataLanguage }: SectionLibraryProps) {
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [templates, setTemplates] = useState<ResumeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ResumeSection['type'] | 'all'>('all');
  const [editingSection, setEditingSection] = useState<ResumeSection | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempNote, setTempNote] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<ResumeSection | null>(null);
  const [compareDocuments, setCompareDocuments] = useState<[ResumeSection, ResumeSection] | null>(null);
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [tempVersionTitle, setTempVersionTitle] = useState('');
  const [tempVersionNote, setTempVersionNote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  // Auto-save drafts to localStorage
  useEffect(() => {
    if (editingSection) {
      const currentContent = editingSection.latexContent || editingSection.content || '';
      if (editedContent !== currentContent) {
        const timeoutId = setTimeout(() => {
          localStorage.setItem(`section-draft-${editingSection.id}`, JSON.stringify({
            content: editedContent,
            timestamp: Date.now()
          }));
        }, 1000); // Auto-save after 1 second of no typing
        
        return () => clearTimeout(timeoutId);
      } else {
        // Remove draft when content matches saved version
        localStorage.removeItem(`section-draft-${editingSection.id}`);
      }
    }
  }, [editedContent, editingSection]);

  const loadData = async () => {
    try {
      const sectionStorage = new SectionStorage(dataLanguage);
      await sectionStorage.initializeDefaultTemplates();
      const [allSections, allTemplates] = await Promise.all([
        sectionStorage.getAllSections(),
        sectionStorage.getTemplates()
      ]);
      setSections(allSections.filter(s => !s.isTemplate));
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = selectedType === 'all' 
    ? sections 
    : sections.filter(s => s.type === selectedType);

  const createFromTemplate = async (template: ResumeSection) => {
    try {
      const sectionStorage = new SectionStorage(dataLanguage);
      const newSection = await sectionStorage.createSectionFromTemplate(template.id, {
        title: `My ${template.title.replace('模板', '')}`
      });
      await loadData();
      if (mode === 'selector' && onSectionSelect) {
        onSectionSelect(newSection);
      }
    } catch (error) {
      console.error('Failed to create from template:', error);
      alert('Failed to create section');
    }
  };

  const startEditing = (section: ResumeSection) => {
    setEditingSection(section);
    
    // Check for existing draft
    const savedDraft = localStorage.getItem(`section-draft-${section.id}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.content && draft.timestamp > Date.now() - 24 * 60 * 60 * 1000) { // 24 hour expiry
          setEditedContent(draft.content);
        } else {
          setEditedContent(section.latexContent || section.content || '');
        }
      } catch (error) {
        setEditedContent(section.latexContent || section.content || '');
      }
    } else {
      setEditedContent(section.latexContent || section.content || '');
    }
    
    setEditingMetadata(false);
  };
  
  const saveMetadata = async () => {
    if (!editingSection || !tempTitle.trim()) return;
    
    try {
      const sectionStorage = new SectionStorage(dataLanguage);
      const updatedSection = {
        ...editingSection,
        title: tempTitle.trim(),
        note: tempNote.trim(),
        updated: new Date().toISOString()
      };
      
      await sectionStorage.saveSection(updatedSection);
      
      // Update the editingSection state immediately for UI sync
      setEditingSection(updatedSection);
      setEditingMetadata(false);
      
      // Reload data to ensure all components are in sync
      await loadData();
      
      // Visual feedback for successful metadata update
      const successEl = document.createElement('div');
      successEl.textContent = 'Metadata updated successfully!';
      successEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      document.body.appendChild(successEl);
      setTimeout(() => {
        if (document.body.contains(successEl)) {
          document.body.removeChild(successEl);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to update section metadata:', error);
      alert('Failed to update section metadata');
    }
  };
  

  // Helper function to convert LaTeX to plain text
  const generatePlainText = (text: string): string => {
    return text
      // Remove LaTeX formatting
      .replace(/\\textbf\{([^}]+)\}/g, '$1')
      .replace(/\\textit\{([^}]+)\}/g, '$1')
      .replace(/\\underline\{([^}]+)\}/g, '$1')
      .replace(/\\datedsubsection\{([^}]+)\}\{([^}]+)\}/g, '$1\n$2')
      .replace(/\\begin\{itemize\}/g, '')
      .replace(/\\end\{itemize\}/g, '')
      .replace(/\\item /g, '')
      .replace(/\\\\\s*/g, '\n')
      .replace(/\\n/g, '\n')
      // Remove Markdown formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold
      .replace(/\*([^*]+)\*/g, '$1')     // Remove italic
      .replace(/_([^_]+)_/g, '$1')       // Remove underline
      .replace(/^#+\s*/gm, '')           // Remove headers
      .replace(/^>\s*/gm, '')            // Remove quotes
      .replace(/^\*\s*/gm, '')           // Remove bullet points
      .replace(/^-\s*/gm, '')            // Remove dashes
      .replace(/^•\s*/gm, '')            // Remove bullets
      .replace(/^\d+\.\s*/gm, '')        // Remove numbered lists
      .replace(/`([^`]+)`/g, '$1')       // Remove inline code
      .replace(/```[\s\S]*?```/g, '')    // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove images, keep alt text
      // Clean up extra whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')  // Remove multiple empty lines
      .replace(/^\s+|\s+$/g, '')         // Trim whitespace
      .trim();
  };

  // Default: Overwrite current version (normal editing behavior)
  const saveChanges = async () => {
    if (!editingSection) return;
    
    // Check if content actually changed
    const currentContent = editingSection.latexContent || editingSection.content || '';
    if (editedContent === currentContent) return;

    try {
      const sectionStorage = new SectionStorage(dataLanguage);
      
      // Overwrite current version
      const updatedSection = {
        ...editingSection,
        content: generatePlainText(editedContent.trim()),
        latexContent: editedContent.trim(),
        updated: new Date().toISOString()
      };
      
      await sectionStorage.saveSection(updatedSection);
      
      // Update the editingSection state immediately to reflect changes in UI
      setEditingSection(updatedSection);
      
      // Clear draft after successful save
      localStorage.removeItem(`section-draft-${updatedSection.id}`);
      
      // Reload data to ensure all components are in sync
      await loadData();
      
      // Visual feedback for successful save
      const successEl = document.createElement('div');
      successEl.textContent = 'Section saved successfully!';
      successEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      document.body.appendChild(successEl);
      setTimeout(() => {
        if (document.body.contains(successEl)) {
          document.body.removeChild(successEl);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to save section:', error);
      alert('Failed to save changes');
    }
  };

  // Explicit: Create new version (branching behavior)
  const saveAsNewVersion = async () => {
    if (!editingSection) return;
    
    // Check if content actually changed
    const currentContent = editingSection.latexContent || editingSection.content || '';
    if (editedContent === currentContent) return;

    try {
      const sectionStorage = new SectionStorage(dataLanguage);
      
      // Create new version
      const newVersion: ResumeSection = {
        id: crypto.randomUUID(),
        type: editingSection.type,
        title: editingSection.title,
        content: generatePlainText(editedContent.trim()),
        latexContent: editedContent.trim(),
        tags: editingSection.tags,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        versionNumber: editingSection.versionNumber + 1,
        parentId: editingSection.id,
        isTemplate: editingSection.isTemplate
      };
      
      await sectionStorage.saveSection(newVersion);
      setEditingSection(newVersion);
      // Clear draft after successful save
      if (editingSection) {
        localStorage.removeItem(`section-draft-${editingSection.id}`);
      }
      await loadData();
    } catch (error) {
      console.error('Failed to create new version:', error);
      alert('Failed to create new version');
    }
  };

  const compareWithOtherDocument = (document: ResumeSection) => {
    setSelectedForComparison(document);
    setShowDocumentSelector(true);
  };

  const selectDocumentForComparison = (otherDocument: ResumeSection) => {
    if (selectedForComparison) {
      setCompareDocuments([selectedForComparison, otherDocument]);
      setShowDiff(true);
      setShowDocumentSelector(false);
      setSelectedForComparison(null);
    }
  };

  const deleteSection = async (sectionOrId: ResumeSection | string) => {
    const section = typeof sectionOrId === 'string' 
      ? sections.find(s => s.id === sectionOrId) || editingSection
      : sectionOrId;
    
    if (!section || !confirm(`Delete "${section.title}"?`)) return;
    
    try {
      const sectionStorage = new SectionStorage(dataLanguage);
      await sectionStorage.deleteSection(section.id);
      
      // If deleting current editing section, clear the editor
      if (editingSection?.id === section.id) {
        setEditingSection(null);
        setEditedContent('');
      }
      
      await loadData();
    } catch (error) {
      console.error('Failed to delete section:', error);
      alert('Failed to delete section');
    }
  };

  const exportAllSections = async () => {
    if (sections.length === 0) {
      alert('No sections to export');
      return;
    }

    try {
      // Create batch export with all sections
      const files: { name: string; content: { json: string; latex: string; plainText: string } }[] = [];
      
      // Group sections by type for better organization
      const sectionsByType = sections.reduce((acc, section) => {
        if (!acc[section.type]) acc[section.type] = [];
        acc[section.type].push(section);
        return acc;
      }, {} as Record<string, ResumeSection[]>);
      
      // Add all sections with multiple format exports
      Object.entries(sectionsByType).forEach(([type, sectionsOfType]) => {
        sectionsOfType.forEach((section, index) => {
          const filename = `${getSectionTypeLabel(section.type as ResumeSection['type'])}-${section.title.replace(/[^a-zA-Z0-9]/g, '-')}-v${section.versionNumber}`;
          
          files.push({
            name: filename,
            content: {
              json: JSON.stringify({
                id: section.id,
                title: section.title,
                type: section.type,
                content: section.content,
                latexContent: section.latexContent,
                tags: section.tags,
                created: section.created,
                updated: section.updated,
                versionNumber: section.versionNumber
              }, null, 2),
              latex: section.latexContent || section.content || '',
              plainText: section.content
                .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove bold
                .replace(/\*(.+?)\*/g, '$1')     // Remove italic
                .replace(/_(.+?)_/g, '$1')       // Remove underline
                .replace(/• /g, '')              // Remove bullet points
                .trim()
            }
          });
        });
      });
      
      // Create combined export file
      let combinedContent = '# BATCH EXPORT - ALL SECTION LIBRARY\n';
      combinedContent += `# Exported on: ${new Date().toISOString()}\n`;
      combinedContent += `# Total sections: ${files.length}\n`;
      combinedContent += `# Section types: ${Object.keys(sectionsByType).join(', ')}\n\n`;
      
      files.forEach((file, index) => {
        combinedContent += `\n${'='.repeat(100)}\n`;
        combinedContent += `SECTION ${index + 1}: ${file.name}\n`;
        combinedContent += `${'='.repeat(100)}\n\n`;
        
        // Add JSON metadata
        combinedContent += '--- METADATA (JSON) ---\n';
        combinedContent += file.content.json;
        combinedContent += '\n\n';
        
        // Add LaTeX content
        combinedContent += '--- LATEX CONTENT ---\n';
        combinedContent += file.content.latex;
        combinedContent += '\n\n';
        
        // Add plain text
        combinedContent += '--- PLAIN TEXT ---\n';
        combinedContent += file.content.plainText;
        combinedContent += '\n\n';
      });
      
      // Download the combined file
      const blob = new Blob([combinedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-sections-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Visual feedback
      const successEl = document.createElement('div');
      successEl.textContent = `✅ Exported ${files.length} sections in batch!`;
      successEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      document.body.appendChild(successEl);
      setTimeout(() => document.body.removeChild(successEl), 3000);
      
    } catch (error) {
      console.error('Failed to export all sections:', error);
      alert('Failed to export all sections');
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
      education: '教育',
      experience: '经历',
      research: '研究',
      skills: '技能',
      achievements: '奖项',
      custom: '其他'
    };
    return labels[type];
  };

  if (loading) {
    return <div className="p-8 text-center">Loading sections...</div>;
  }

  return (
    <div className="p-4">
      {/* Header - consistent with Resume/Cover Letter style */}
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {editingMetadata ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                  placeholder="Section title"
                />
                <input
                  type="text"
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  className="text-gray-600 bg-transparent border-b border-gray-300 focus:outline-none w-full"
                  placeholder="Section notes (optional)"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={saveMetadata}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingMetadata(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => {
                  if (editingSection) {
                    setTempTitle(editingSection.title);
                    setTempNote(editingSection.note || '');
                    setEditingMetadata(true);
                  }
                }}
              >
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {editingSection ? (
                    <>
                      <span className="text-2xl">{getSectionTypeIcon(editingSection.type)}</span>
                      {editingSection.title}
                    </>
                  ) : (
                    'Section Library'
                  )}
                </h1>
                <p className="text-gray-600 mt-1">
                  {editingSection 
                    ? `${editingSection.note || 'Click to edit title and notes'} • ${getSectionTypeLabel(editingSection.type)} Section`
                    : 'Build and manage reusable resume sections'
                  }
                </p>
              </div>
            )}
          </div>
          
          {/* Action buttons moved to header for consistency */}
          {editingSection && (
            <div className="flex gap-2">
              {/* Primary Actions */}
              <div className="flex gap-3 mr-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    if (!editingSection) return null;
                    const currentContent = editingSection.latexContent || editingSection.content || '';
                    const hasChanges = editedContent !== currentContent && editedContent !== '';
                    return hasChanges ? (
                      <div className="text-xs text-amber-600 font-medium">
                        ● Unsaved changes
                      </div>
                    ) : null;
                  })()}
                  <button
                    onClick={saveChanges}
                    disabled={(() => {
                      if (!editingSection) return true;
                      const currentContent = editingSection.latexContent || editingSection.content || '';
                      return editedContent === currentContent || editedContent === '';
                    })()}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    Save
                  </button>
                </div>
                <button
                  onClick={saveAsNewVersion}
                  disabled={(() => {
                    if (!editingSection) return true;
                    const currentContent = editingSection.latexContent || editingSection.content || '';
                    return editedContent === currentContent || editedContent === '';
                  })()}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  title="Create a copy with your changes"
                >
                  Duplicate & Save
                </button>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (editingSection) {
                      // Get the plain text content, not LaTeX
                      const plainText = editingSection.content || generatePlainText(editedContent || editingSection.latexContent || '');
                      navigator.clipboard.writeText(plainText);
                      
                      // Visual feedback
                      const successEl = document.createElement('div');
                      successEl.textContent = 'Plain text copied to clipboard!';
                      successEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      document.body.appendChild(successEl);
                      setTimeout(() => {
                        if (document.body.contains(successEl)) {
                          document.body.removeChild(successEl);
                        }
                      }, 2000);
                    }
                  }}
                  disabled={!editingSection}
                  className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title="Copy section content as plain text"
                >
                  Copy Text
                </button>
                <button
                  onClick={() => {
                    if (editingSection && sections.length > 1) {
                      setSelectedForComparison(editingSection);
                      setShowDocumentSelector(true);
                    }
                  }}
                  disabled={!editingSection || sections.length <= 1}
                  className="px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title={sections.length <= 1 ? "Need at least 2 sections to compare" : "Compare with another section"}
                >
                  Compare
                </button>
                <button
                  onClick={exportAllSections}
                  className="px-3 py-2 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
                  title="Export all sections"
                >
                  📤 Export
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs - more compact */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium ${
              selectedType === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({sections.length})
          </button>
          {(['education', 'experience', 'research', 'skills', 'achievements', 'custom'] as ResumeSection['type'][]).map(type => {
            const count = sections.filter(s => s.type === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded text-xs font-medium ${
                  selectedType === type 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getSectionTypeIcon(type)} {getSectionTypeLabel(type)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content - consistent with Resume/Cover Letter layout */}
      <div className="grid grid-cols-12 gap-4 mt-2">
        {/* Section List */}
        <div className="col-span-3 bg-white rounded-lg shadow">
          <div className="p-3 border-b border-gray-200">
            <h2 className="text-sm font-medium">Sections ({filteredSections.length})</h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredSections.map(section => (
              <div
                key={section.id}
                className={`group relative h-16 p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  editingSection?.id === section.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => startEditing(section)}
              >
                <div className="flex items-center justify-between h-full">
                  {editingVersion === section.id ? (
                    <>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={tempVersionTitle}
                          onChange={(e) => setTempVersionTitle(e.target.value)}
                          className="w-full text-xs font-medium bg-transparent border-b border-blue-500 focus:outline-none mb-1"
                          placeholder="Section title"
                        />
                        <input
                          type="text"
                          value={tempVersionNote}
                          onChange={(e) => setTempVersionNote(e.target.value)}
                          className="w-full text-xs bg-transparent border-b border-gray-300 focus:outline-none"
                          placeholder="Section notes"
                        />
                      </div>
                      
                      {/* Edit Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => {
                            if (tempVersionTitle.trim()) {
                              try {
                                const sectionStorage = new SectionStorage(dataLanguage);
                                const updatedSection = {
                                  ...section,
                                  title: tempVersionTitle.trim(),
                                  note: tempVersionNote.trim(),
                                  updated: new Date().toISOString()
                                };
                                await sectionStorage.saveSection(updatedSection);
                                
                                // If this is the currently editing section, update it too
                                if (editingSection?.id === section.id) {
                                  setEditingSection(updatedSection);
                                }
                                
                                await loadData();
                                
                                // Visual feedback
                                const successEl = document.createElement('div');
                                successEl.textContent = 'Section updated successfully!';
                                successEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                                document.body.appendChild(successEl);
                                setTimeout(() => {
                                  if (document.body.contains(successEl)) {
                                    document.body.removeChild(successEl);
                                  }
                                }, 2000);
                              } catch (error) {
                                console.error('Failed to update section:', error);
                                alert('Failed to update section');
                              }
                            }
                            setEditingVersion(null);
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Save changes"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingVersion(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs flex items-center gap-1 mb-1">
                          <span className="text-sm">{getSectionTypeIcon(section.type)}</span>
                          <span className="truncate">{section.title}</span>
                        </h4>
                        <p className="text-xs text-gray-500 truncate mb-1">{section.note || 'No notes'}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(section.updated || section.created).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Hover Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        {mode === 'selector' && onSectionSelect ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSectionSelect(section);
                            }}
                            className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded"
                            title="Select section"
                          >
                            ✓
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTempVersionTitle(section.title);
                                setTempVersionNote(section.note || '');
                                setEditingVersion(section.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit section"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSection(section.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete section"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            <div className="p-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Templates</h3>
              <div className="space-y-2">
                {templates.map(template => (
                  <div key={template.id} className="flex items-center gap-2">
                    <button
                      onClick={() => startEditing(template)}
                      className={`flex-1 flex items-center gap-2 p-2 text-left rounded text-sm ${
                        editingSection?.id === template.id 
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      <span>{getSectionTypeIcon(template.type)}</span>
                      <span>{template.title}</span>
                    </button>
                    <button
                      onClick={() => createFromTemplate(template)}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                      title="Create new from template"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {filteredSections.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium mb-2">No sections yet</h3>
                <p className="text-sm">Create some from templates above</p>
              </div>
            )}
          </div>
        </div>

        {/* Section Editor - Unified with Resume/Cover Letter style */}
        <div className="col-span-9">
          {editingSection ? (
            <div className="bg-white rounded-lg shadow">
              {/* Editor - Same style as Resume/Cover Letter */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4">
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                        e.preventDefault();
                        saveChanges();
                      }
                    }}
                    className="w-full h-96 p-4 border border-gray-300 rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Write your section content here...

Use formatting:
**bold text**
*italic text*
_underlined text_
• bullet points

Example for Experience:
**Company Name** | Department, **Position**, City
2021-2022

• Achievement with specific metrics
• Technical contribution using X, Y, Z
• Leadership responsibility for N people"
                    style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', lineHeight: '1.6' }}
                  />
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-300 text-xs text-gray-500">
                    Press Ctrl/Cmd + S to save • {editedContent.split('\n').length} lines • LaTeX auto-generated
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">←</div>
              <h3 className="text-lg font-medium mb-2">Select a section to edit</h3>
              <p>Click on a section from the list to start editing</p>
            </div>
          )}
        </div>
      </div>

      {/* Document Selector Modal */}
      {showDocumentSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Compare current section with:
                </h2>
                <button
                  onClick={() => {
                    setShowDocumentSelector(false);
                    setSelectedForComparison(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {sections.filter(s => s.id !== selectedForComparison?.id).map(section => (
                  <button
                    key={section.id}
                    onClick={() => selectDocumentForComparison(section)}
                    className="w-full p-3 text-left border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getSectionTypeIcon(section.type)}</span>
                      <div className="font-medium">{section.title}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {new Date(section.created).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diff Modal */}
      {showDiff && compareDocuments && (
        <DocumentDiff
          oldContent={compareDocuments[0].content}
          newContent={compareDocuments[1].content}
          oldTitle={compareDocuments[0].title}
          newTitle={compareDocuments[1].title}
          onClose={() => {
            setShowDiff(false);
            setCompareDocuments(null);
          }}
        />
      )}


    </div>
  );
}