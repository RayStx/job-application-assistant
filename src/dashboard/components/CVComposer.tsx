import React, { useState, useEffect } from 'react';
import { SectionStorage } from '@/lib/storage/sectionStorage';
import { CVStorage } from '@/lib/storage/cvStorage';
import { SectionLibrary } from './SectionLibrary';
import type { ResumeSection, CVComposition, CVVersion } from '@/types';

interface CVComposerProps {
  onClose: () => void;
  onSave?: () => void;
}

export function CVComposer({ onClose, onSave }: CVComposerProps) {
  const [selectedSections, setSelectedSections] = useState<ResumeSection[]>([]);
  const [availableSections, setAvailableSections] = useState<ResumeSection[]>([]);
  const [compositionName, setCompositionName] = useState('');
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [previewLatex, setPreviewLatex] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
    generatePreview();
  }, [selectedSections]);

  const loadSections = async () => {
    try {
      const sectionStorage = new SectionStorage();
      const sections = await sectionStorage.getAllSections();
      setAvailableSections(sections.filter(s => !s.isTemplate));
    } catch (error) {
      console.error('Failed to load sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    if (selectedSections.length === 0) {
      setPreviewLatex('% Select sections to see preview');
      return;
    }

    const latex = selectedSections.map(section => section.latexContent).join('\n\n');
    setPreviewLatex(latex);
  };

  const handleSectionSelect = (section: ResumeSection) => {
    if (!selectedSections.find(s => s.id === section.id)) {
      setSelectedSections([...selectedSections, section]);
    }
    setShowSectionSelector(false);
  };

  const removeSection = (sectionId: string) => {
    setSelectedSections(selectedSections.filter(s => s.id !== sectionId));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...selectedSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newSections.length) {
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      setSelectedSections(newSections);
    }
  };

  const saveComposition = async () => {
    if (!compositionName.trim()) {
      alert('Please enter a name for this CV');
      return;
    }

    if (selectedSections.length === 0) {
      alert('Please select at least one section');
      return;
    }

    try {
      const cvStorage = new CVStorage();
      const versionNumber = await cvStorage.getNextVersionNumber();
      const hash = await cvStorage.createHashForContent(previewLatex);

      const newVersion: CVVersion = {
        id: crypto.randomUUID(),
        versionNumber,
        content: previewLatex,
        format: 'latex',
        created: new Date().toISOString(),
        tags: ['composed'],
        note: compositionName,
        hash,
        linkedApplications: []
      };

      await cvStorage.save(newVersion);
      
      // Also save the composition for future reference
      const sectionStorage = new SectionStorage();
      const composition: CVComposition = {
        id: crypto.randomUUID(),
        name: compositionName,
        sectionIds: selectedSections.map(s => s.id),
        sectionOrder: selectedSections.map((_, index) => index),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        versionNumber: 1
      };

      await sectionStorage.saveComposition(composition);
      
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Failed to save composition:', error);
      alert('Failed to save CV');
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

  if (loading) {
    return <div className="p-8 text-center">Loading sections...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50\">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden\">
        <div className="p-4 border-b border-gray-200\">
          <div className="flex items-center justify-between\">
            <div>
              <h2 className="text-lg font-semibold\">Compose New CV</h2>
              <p className="text-sm text-gray-600\">Build your CV from existing sections</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl\"
            >
              ×
            </button>
          </div>
          <div className="mt-4\">
            <input
              type="text\"
              value={compositionName}
              onChange={(e) => setCompositionName(e.target.value)}
              placeholder="Enter CV name (e.g., 'Tech Jobs CV', 'Research Position CV')\"
              className="w-full px-3 py-2 border border-gray-300 rounded\"
            />
          </div>
        </div>

        <div className="flex h-[75vh]\">
          {/* Left Panel - Section Selection */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col\">
            <div className="p-4 bg-gray-50 border-b border-gray-200\">
              <div className="flex items-center justify-between\">
                <h3 className="font-medium\">Selected Sections ({selectedSections.length})</h3>
                <button
                  onClick={() => setShowSectionSelector(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700\"
                >
                  Add Section
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto\">
              {selectedSections.length === 0 ? (
                <div className="p-8 text-center text-gray-500\">
                  <div className="text-4xl mb-4\">📝</div>
                  <p>No sections selected</p>
                  <p className="text-sm\">Click \"Add Section\" to start building your CV</p>
                </div>
              ) : (
                <div className="p-4 space-y-3\">
                  {selectedSections.map((section, index) => (
                    <div key={section.id} className="bg-white border rounded-lg p-3\">
                      <div className="flex items-start justify-between\">
                        <div className="flex items-center gap-2 flex-1\">
                          <span className="text-lg\">{getSectionTypeIcon(section.type)}</span>
                          <div className="flex-1\">
                            <h4 className="font-medium text-sm\">{section.title}</h4>
                            <p className="text-xs text-gray-500 truncate\">
                              {section.content.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2\">
                          <button
                            onClick={() => moveSection(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30\"
                            title="Move up\"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveSection(index, 'down')}
                            disabled={index === selectedSections.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30\"
                            title="Move down\"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeSection(section.id)}
                            className="p-1 text-red-400 hover:text-red-600\"
                            title="Remove\"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 flex flex-col\">
            <div className="p-4 bg-gray-50 border-b border-gray-200\">
              <h3 className="font-medium\">LaTeX Preview</h3>
            </div>
            <div className="flex-1 p-4\">
              <pre className="w-full h-full bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-auto whitespace-pre-wrap\">
                {previewLatex}
              </pre>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3\">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50\"
          >
            Cancel
          </button>
          <button
            onClick={saveComposition}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700\"
            disabled={!compositionName.trim() || selectedSections.length === 0}
          >
            Save CV
          </button>
        </div>
      </div>

      {/* Section Selector Modal */}
      {showSectionSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]\">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden\">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between\">
              <h3 className="text-lg font-semibold\">Select Section to Add</h3>
              <button
                onClick={() => setShowSectionSelector(false)}
                className="text-gray-500 hover:text-gray-700 text-xl\"
              >
                ×
              </button>
            </div>
            <div className="overflow-auto\" style={{ maxHeight: 'calc(90vh - 100px)' }}>
              <SectionLibrary 
                mode="selector" 
                onSectionSelect={handleSectionSelect}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}