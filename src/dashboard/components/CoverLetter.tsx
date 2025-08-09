import React, { useState, useEffect } from 'react';
import { CVStorage } from '@/lib/storage/cvStorage';
import { ApplicationStorage } from '@/lib/storage/applications';
import { DocumentDiff } from './DocumentDiff';
import { loadLinkedApplicationsForDocument, getDocumentDisplayName, getDocumentVersionDisplay } from '@/lib/utils/applicationLinking';
import type { CVVersion, JobApplication } from '@/types';

interface CoverLetterProps {
  dataLanguage: 'zh' | 'en';
}

export function CoverLetter({ dataLanguage }: CoverLetterProps) {
  const [currentLetter, setCurrentLetter] = useState<CVVersion | null>(null);
  const [allVersions, setAllVersions] = useState<CVVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedContent, setEditedContent] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<CVVersion | null>(null);
  const [compareDocuments, setCompareDocuments] = useState<[CVVersion, CVVersion] | null>(null);
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [tempNote, setTempNote] = useState('');
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [tempVersionTitle, setTempVersionTitle] = useState('');
  const [tempVersionNote, setTempVersionNote] = useState('');
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingVersion, setLinkingVersion] = useState<CVVersion | null>(null);
  const [linkedApplications, setLinkedApplications] = useState<JobApplication[]>([]);

  useEffect(() => {
    loadData();
    // Restore unsaved changes from localStorage
    const savedDraft = localStorage.getItem('cover-letter-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.content) {
          setEditedContent(draft.content);
        }
      } catch (error) {
        console.error('Failed to restore draft:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (currentLetter) {
      loadLinkedApplications();
    }
  }, [currentLetter]);

  // Auto-save drafts to localStorage
  useEffect(() => {
    if (currentLetter && editedContent !== currentLetter.content) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('cover-letter-draft', JSON.stringify({
          documentId: currentLetter.id,
          content: editedContent,
          timestamp: Date.now()
        }));
      }, 1000); // Auto-save after 1 second of no typing
      
      return () => clearTimeout(timeoutId);
    } else if (currentLetter && editedContent === currentLetter.content) {
      // Remove draft when content matches saved version
      localStorage.removeItem('cover-letter-draft');
    }
  }, [editedContent, currentLetter]);


  useEffect(() => {
    // Check URL hash for specific version to load
    const checkHashForVersion = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#cover-letter-')) {
        const versionId = hash.replace('#cover-letter-', '');
        const version = allVersions.find(v => v.id === versionId);
        if (version && version.id !== currentLetter?.id) {
          loadVersion(version);
          // Clear hash after loading
          window.location.hash = '';
        }
      }
    };
    
    checkHashForVersion();
    window.addEventListener('hashchange', checkHashForVersion);
    
    return () => window.removeEventListener('hashchange', checkHashForVersion);
  }, [allVersions, currentLetter]);

  const loadLinkedApplications = async () => {
    if (!currentLetter) return;
    
    try {
      const linked = await loadLinkedApplicationsForDocument(currentLetter.id, 'cover-letter');
      setLinkedApplications(linked);
    } catch (error) {
      console.error('Failed to load linked applications:', error);
      setLinkedApplications([]);
    }
  };

  const loadData = async () => {
    try {
      const cvStorage = new CVStorage(dataLanguage);
      const versions = await cvStorage.getAll();
      
      // Filter only cover letters (not resumes)
      const letterVersions = versions.filter(v => v.type === 'cover-letter');
      setAllVersions(letterVersions.sort((a, b) => b.versionNumber - a.versionNumber));
      
      // Load most recent cover letter or create default
      if (letterVersions.length > 0) {
        const latest = letterVersions[0];
        setCurrentLetter(latest);
        setEditedContent(latest.content);
      } else {
        // Create first cover letter
        await createNewCoverLetter();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewCoverLetter = async () => {
    try {
      const cvStorage = new CVStorage(dataLanguage);
      const versionNumber = await cvStorage.getNextVersionNumber();
      
      const newLetter: CVVersion = {
        id: crypto.randomUUID(),
        title: 'Cover Letter',
        content: 'Dear Hiring Manager,\n\nI am writing to express my interest in the [Position] role at [Company]. \n\n[Your compelling introduction paragraph]\n\n[Body paragraph highlighting relevant experience]\n\n[Closing paragraph with call to action]\n\nSincerely,\n[Your Name]',
        versionNumber,
        created: new Date().toISOString(),
        note: 'Initial cover letter template',
        type: 'cover-letter',
        linkedApplications: []
      };
      
      await cvStorage.save(newLetter);
      setCurrentLetter(newLetter);
      setEditedContent(newLetter.content);
      await loadData();
    } catch (error) {
      console.error('Failed to create new cover letter:', error);
    }
  };

  // Default: Overwrite current version (normal editing behavior)
  const saveChanges = async () => {
    if (!currentLetter) return;
    
    // Check if content actually changed
    if (editedContent === currentLetter.content) return;

    try {
      const cvStorage = new CVStorage(dataLanguage);
      
      // Update current version in place
      const updatedLetter: CVVersion = {
        ...currentLetter,
        content: editedContent,
        updated: new Date().toISOString()
      };
      
      await cvStorage.save(updatedLetter);
      setCurrentLetter(updatedLetter);
      // Clear draft after successful save
      localStorage.removeItem('cover-letter-draft');
      await loadData();
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('Failed to save changes');
    }
  };

  // Explicit: Create new version (branching behavior)
  const saveAsNewVersion = async () => {
    if (!currentLetter) return;
    
    // Check if content actually changed
    if (editedContent === currentLetter.content) return;

    try {
      const cvStorage = new CVStorage(dataLanguage);
      const versionNumber = await cvStorage.getNextVersionNumber();
      
      const newVersion: CVVersion = {
        id: crypto.randomUUID(),
        title: currentLetter.title,
        content: editedContent,
        versionNumber,
        created: new Date().toISOString(),
        note: `Updated from v${currentLetter.versionNumber}`,
        type: 'cover-letter',
        parentId: currentLetter.id,
        linkedApplications: []
      };
      
      await cvStorage.save(newVersion);
      setCurrentLetter(newVersion);
      await loadData();
    } catch (error) {
      console.error('Failed to create new version:', error);
      alert('Failed to create new version');
    }
  };

  const loadVersion = (version: CVVersion) => {
    setCurrentLetter(version);
    setEditedContent(version.content);
  };

  const compareWithOtherDocument = (document: CVVersion) => {
    setSelectedForComparison(document);
    setShowDocumentSelector(true);
  };

  const selectDocumentForComparison = (otherDocument: CVVersion) => {
    if (selectedForComparison) {
      setCompareDocuments([selectedForComparison, otherDocument]);
      setShowDiff(true);
      setShowDocumentSelector(false);
      setSelectedForComparison(null);
    }
  };
  
  const saveVersionMetadata = async (versionId: string) => {
    try {
      const cvStorage = new CVStorage(dataLanguage);
      const updates = {
        title: tempVersionTitle.trim(),
        note: tempVersionNote.trim()
      };
      
      await cvStorage.updateCV(versionId, updates);
      setEditingVersion(null);
      await loadData();
      
      // Update current letter if it's the one being edited
      if (currentLetter?.id === versionId) {
        setCurrentLetter({ ...currentLetter, ...updates });
      }
    } catch (error) {
      console.error('Failed to update version metadata:', error);
      alert('Failed to update version metadata');
    }
  };

  const deleteVersion = async (versionId: string) => {
    const version = allVersions.find(v => v.id === versionId);
    if (!version || !confirm(`Delete "${version.title || 'Cover Letter'}"?`)) return;
    
    try {
      const cvStorage = new CVStorage(dataLanguage);
      await cvStorage.delete(versionId);
      
      // If deleting current version, switch to another one or create new
      if (currentLetter?.id === versionId) {
        const remaining = allVersions.filter(v => v.id !== versionId);
        if (remaining.length > 0) {
          const latest = remaining[0];
          setCurrentLetter(latest);
          setEditedContent(latest.content);
        } else {
          // No versions left, create a new default one
          await createNewCoverLetter();
        }
      }
      
      await loadData();
    } catch (error) {
      console.error('Failed to delete version:', error);
      alert('Failed to delete version');
    }
  };

  const exportAllCoverLetters = async () => {
    if (allVersions.length === 0) {
      alert('No cover letter versions to export');
      return;
    }

    try {
      // Create a batch export with all cover letter files
      const files: { name: string; content: string }[] = [];
      
      // Add all cover letter versions
      allVersions.forEach(version => {
        const filename = `${(version.title || 'Cover-Letter').replace(/[^a-zA-Z0-9]/g, '-')}-v${version.versionNumber}.txt`;
        files.push({
          name: filename,
          content: version.content
        });
      });
      
      // Add metadata file
      const metadata = {
        exportDate: new Date().toISOString(),
        totalVersions: allVersions.length,
        versions: allVersions.map(v => ({
          id: v.id,
          title: v.title,
          versionNumber: v.versionNumber,
          created: v.created,
          updated: v.updated,
          note: v.note,
          linkedApplications: v.linkedApplications || []
        }))
      };
      
      files.push({
        name: 'cover-letters-metadata.json',
        content: JSON.stringify(metadata, null, 2)
      });
      
      // Create combined export file
      let combinedContent = '# BATCH EXPORT - ALL COVER LETTER VERSIONS\n';
      combinedContent += `# Exported on: ${new Date().toISOString()}\n`;
      combinedContent += `# Total files: ${files.length}\n\n`;
      
      files.forEach((file, index) => {
        combinedContent += `\n${'='.repeat(80)}\n`;
        combinedContent += `FILE ${index + 1}: ${file.name}\n`;
        combinedContent += `${'='.repeat(80)}\n\n`;
        combinedContent += file.content;
        combinedContent += '\n\n';
      });
      
      // Download the combined file
      const blob = new Blob([combinedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-cover-letters-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Visual feedback
      const successEl = document.createElement('div');
      successEl.textContent = `✅ Exported ${files.length} files in batch!`;
      successEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      document.body.appendChild(successEl);
      setTimeout(() => document.body.removeChild(successEl), 3000);
      
    } catch (error) {
      console.error('Failed to export all cover letters:', error);
      alert('Failed to export all cover letters');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
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
                  placeholder="Cover Letter title"
                />
                <input
                  type="text"
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  className="text-gray-600 bg-transparent border-b border-gray-300 focus:outline-none w-full"
                  placeholder="Version notes"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={async () => {
                      if (currentLetter && tempTitle.trim()) {
                        const cvStorage = new CVStorage(dataLanguage);
                        const updated = { ...currentLetter, title: tempTitle.trim(), note: tempNote.trim() };
                        await cvStorage.updateCV(updated.id, updated);
                        setCurrentLetter(updated);
                        await loadData();
                      }
                      setEditingMetadata(false);
                    }}
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
                  setTempTitle(currentLetter?.title || 'Cover Letter');
                  setTempNote(currentLetter?.note || '');
                  setEditingMetadata(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentLetter?.title || 'Cover Letter'}
                  </h1>
                  {linkedApplications.length > 0 && (
                    <span 
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium cursor-pointer hover:bg-purple-200 transition-colors"
                      title={`Used in ${linkedApplications.length} application${linkedApplications.length > 1 ? 's' : ''}: ${linkedApplications.map(app => `${app.company} - ${app.title}`).join(', ')}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Create a simple dropdown or modal showing all linked applications
                        const appsList = linkedApplications.map(app => `• ${app.company} - ${app.title}`).join('\n');
                        alert(`🔗 This cover letter is linked to:\n\n${appsList}\n\nClick individual applications in the Job Applications tab to view them.`);
                      }}
                    >
                      🔗 {linkedApplications.length} app{linkedApplications.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">
                  {currentLetter?.note || 'Click to edit'} • Auto-saves with version control
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            {/* Left: Primary editing actions */}
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                {editedContent !== currentLetter?.content && (
                  <div className="text-xs text-amber-600">
                    ● Unsaved changes
                  </div>
                )}
                <button
                  onClick={saveChanges}
                  disabled={editedContent === currentLetter?.content}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
              <button
                onClick={saveAsNewVersion}
                disabled={editedContent === currentLetter?.content}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                title="Create a copy with your changes"
              >
                Duplicate & Save
              </button>
            </div>
            
            {/* Right: Utility actions in dropdown */}
            <div className="relative">
              <button 
                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                onClick={(e) => {
                  const menu = e.currentTarget.nextElementSibling as HTMLElement;
                  if (menu) {
                    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                  }
                }}
              >
                More ⋯
              </button>
              
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10" style={{display: 'none'}}>
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        if (currentLetter && allVersions.length > 1) {
                          setSelectedForComparison(currentLetter);
                          setShowDocumentSelector(true);
                        }
                        const button = e.currentTarget;
                        const menu = button?.closest('.relative')?.querySelector('.absolute') as HTMLElement;
                        if (menu) menu.style.display = 'none';
                      }}
                      disabled={!currentLetter || allVersions.length <= 1}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-white"
                      title={allVersions.length <= 1 ? "Need at least 2 documents to compare" : "Compare with another cover letter"}
                    >
                      Compare with other cover letter
                    </button>
                    <button
                      onClick={(e) => {
                        if (currentLetter) {
                          navigator.clipboard.writeText(editedContent);
                          const successEl = document.createElement('div');
                          successEl.textContent = 'Cover letter text copied to clipboard!';
                          successEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                          document.body.appendChild(successEl);
                          setTimeout(() => document.body.removeChild(successEl), 2000);
                        }
                        const button = e.currentTarget;
                        const menu = button?.closest('.relative')?.querySelector('.absolute') as HTMLElement;
                        if (menu) menu.style.display = 'none';
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Copy text to clipboard
                    </button>
                    <button
                      onClick={async (e) => {
                        const appStorage = new ApplicationStorage(dataLanguage);
                        const apps = await appStorage.getAll();
                        setApplications(apps);
                        setShowLinkModal(true);
                        setLinkingVersion(currentLetter);
                        const button = e.currentTarget;
                        const menu = button?.closest('.relative')?.querySelector('.absolute') as HTMLElement;
                        if (menu) menu.style.display = 'none';
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Link to job application
                    </button>
                    <button
                      onClick={(e) => {
                        exportAllCoverLetters();
                        const button = e.currentTarget;
                        const menu = button?.closest('.relative')?.querySelector('.absolute') as HTMLElement;
                        if (menu) menu.style.display = 'none';
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      title="Export all cover letter versions in batch"
                    >
                      Export all versions ({allVersions.length})
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-4 mt-2">
        {/* Versions Panel */}
        <div className="col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-3 border-b border-gray-200">
              <h3 className="font-medium text-sm">Version History</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {allVersions.map(version => (
                <div
                  key={version.id}
                  className={`group relative h-16 p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    currentLetter?.id === version.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => loadVersion(version)}
                >
                  <div className="flex items-center justify-between h-full">
                    {editingVersion === version.id ? (
                      <>
                        <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={tempVersionTitle}
                          onChange={(e) => setTempVersionTitle(e.target.value)}
                          className="w-full text-xs font-medium bg-transparent border-b border-blue-500 focus:outline-none mb-1"
                          placeholder="Cover Letter title"
                        />
                        <input
                          type="text"
                          value={tempVersionNote}
                          onChange={(e) => setTempVersionNote(e.target.value)}
                          className="w-full text-xs bg-transparent border-b border-gray-300 focus:outline-none"
                          placeholder="Version notes"
                        />
                      </div>
                      
                      {/* Edit Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveVersionMetadata(version.id)}
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
                          <h4 className="font-medium text-xs truncate mb-1">
                            {version.title || 'Cover Letter'}
                          </h4>
                          <p className="text-xs text-gray-500 truncate mb-1">{version.note || 'No notes'}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(version.created).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {/* Hover Actions */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTempVersionTitle(version.title || 'Cover Letter');
                              setTempVersionNote(version.note || '');
                              setEditingVersion(version.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit version"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteVersion(version.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete version"
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {allVersions.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No versions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="col-span-9">
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
                placeholder="Write your cover letter here..."
                style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace', lineHeight: '1.6' }}
              />
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-300 text-xs text-gray-500">
                Press Ctrl/Cmd + S to save • {editedContent.split('\n').length} lines
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Selector Modal */}
      {showDocumentSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Compare current cover letter with:
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
                {allVersions.filter(v => v.id !== selectedForComparison?.id).map(version => (
                  <button
                    key={version.id}
                    onClick={() => selectDocumentForComparison(version)}
                    className="w-full p-3 text-left border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <div className="font-medium">{version.title || 'Cover Letter'}</div>
                    <div className="text-sm text-gray-600">{version.note}</div>
                    <div className="text-xs text-gray-500">
                      Created: {new Date(version.created).toLocaleDateString()}
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
          oldTitle={compareDocuments[0].title || 'Cover Letter'}
          newTitle={compareDocuments[1].title || 'Cover Letter'}
          onClose={() => {
            setShowDiff(false);
            setCompareDocuments(null);
          }}
        />
      )}
      
      {/* Link to Application Modal */}
      {showLinkModal && linkingVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Link Cover Letter to Application</h2>
              <p className="text-sm text-gray-600">
                {linkingVersion.title || 'Cover Letter'}
              </p>
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {applications.length > 0 ? (
                <div className="space-y-2">
                  {applications.map(app => (
                    <button
                      key={app.id}
                      onClick={async () => {
                        try {
                          const appStorage = new ApplicationStorage(dataLanguage);
                          const cvStorage = new CVStorage(dataLanguage);
                          const updatedApp = { ...app, coverLetterVersionId: linkingVersion.id };
                          await appStorage.save(updatedApp);
                          await cvStorage.linkToApplication(linkingVersion.id, app.id);
                          setShowLinkModal(false);
                          
                          // Refresh linked applications display
                          await loadLinkedApplications();
                          
                          // Refresh global application data for Job Applications interface
                          if ((window as any).refreshApplicationData) {
                            (window as any).refreshApplicationData();
                          }
                          
                          // Better visual feedback
                          const successEl = document.createElement('div');
                          successEl.innerHTML = `✅ Cover Letter linked to <strong>${app.company} - ${app.title}</strong>`;
                          successEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded shadow-lg z-50 max-w-sm';
                          document.body.appendChild(successEl);
                          setTimeout(() => document.body.removeChild(successEl), 4000);
                        } catch (error) {
                          console.error('Failed to link:', error);
                          alert('Failed to link to application');
                        }
                      }}
                      className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50"
                    >
                      <div className="font-medium">{app.title}</div>
                      <div className="text-sm text-gray-600">{app.company}</div>
                      <div className="text-xs text-gray-500">{app.status}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No applications found</p>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}