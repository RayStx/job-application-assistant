import React, { useState, useEffect } from 'react';
import { CVStorage } from '@/lib/storage/cvStorage';
import { SectionStorage } from '@/lib/storage/sectionStorage';
import { ApplicationStorage } from '@/lib/storage/applications';
import { LaTeXEditor } from './LaTeXEditor';
import { DocumentDiff } from './DocumentDiff';
import { loadLinkedApplicationsForDocument, getDocumentDisplayName, getDocumentVersionDisplay } from '@/lib/utils/applicationLinking';
import type { CVVersion, ResumeSection, JobApplication } from '@/types';

interface SimpleCVProps {
  dataLanguage: 'zh' | 'en';
}

export function SimpleCV({ dataLanguage }: SimpleCVProps) {
  const [currentCV, setCurrentCV] = useState<CVVersion | null>(null);
  const [allVersions, setAllVersions] = useState<CVVersion[]>([]);
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedContent, setEditedContent] = useState('');
  const [showVersions, setShowVersions] = useState(true);
  const [showSections, setShowSections] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<CVVersion | null>(null);
  const [compareDocuments, setCompareDocuments] = useState<[CVVersion, CVVersion] | null>(null);
  const [editorRef, setEditorRef] = useState<{ insertAtCursor: (text: string) => void } | null>(null);
  const [previewSection, setPreviewSection] = useState<ResumeSection | null>(null);
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
    const savedDraft = localStorage.getItem('resume-draft');
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
    if (currentCV) {
      loadLinkedApplications();
    }
  }, [currentCV]);

  // Auto-save drafts to localStorage
  useEffect(() => {
    if (currentCV && editedContent !== currentCV.content) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('resume-draft', JSON.stringify({
          documentId: currentCV.id,
          content: editedContent,
          timestamp: Date.now()
        }));
      }, 1000); // Auto-save after 1 second of no typing
      
      return () => clearTimeout(timeoutId);
    } else if (currentCV && editedContent === currentCV.content) {
      // Remove draft when content matches saved version
      localStorage.removeItem('resume-draft');
    }
  }, [editedContent, currentCV]);

  useEffect(() => {
    // Check URL hash for specific version to load
    const checkHashForVersion = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#resume-')) {
        const versionId = hash.replace('#resume-', '');
        const version = allVersions.find(v => v.id === versionId);
        if (version && version.id !== currentCV?.id) {
          loadVersion(version);
          // Clear hash after loading
          window.location.hash = '';
        }
      }
    };
    
    checkHashForVersion();
    window.addEventListener('hashchange', checkHashForVersion);
    
    return () => window.removeEventListener('hashchange', checkHashForVersion);
  }, [allVersions, currentCV]);

  const loadLinkedApplications = async () => {
    if (!currentCV) return;
    
    try {
      const linked = await loadLinkedApplicationsForDocument(currentCV.id, 'resume');
      setLinkedApplications(linked);
    } catch (error) {
      console.error('Failed to load linked applications:', error);
      setLinkedApplications([]);
    }
  };

  const loadData = async () => {
    try {
      const cvStorage = new CVStorage(dataLanguage);
      const sectionStorage = new SectionStorage(dataLanguage);
      
      // Initialize templates first
      await sectionStorage.initializeDefaultTemplates();
      
      const [versions, allSections] = await Promise.all([
        cvStorage.getAll(),
        sectionStorage.getAllSections()
      ]);
      
      // Filter only resume versions (not cover letters)
      const resumeVersions = versions.filter(v => v.type !== 'cover-letter');
      setAllVersions(resumeVersions.sort((a, b) => b.versionNumber - a.versionNumber));
      const nonTemplates = allSections.filter(s => !s.isTemplate);
      setSections(nonTemplates);
      console.log('Loaded sections:', nonTemplates.length, 'sections');
      
      // Load most recent resume (not cover letter) or create default
      if (resumeVersions.length > 0) {
        const latest = resumeVersions[0];
        setCurrentCV(latest);
        setEditedContent(latest.content);
      } else {
        // Create first CV
        await createNewCV();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewCV = async () => {
    try {
      const cvStorage = new CVStorage(dataLanguage);
      const versionNumber = await cvStorage.getNextVersionNumber();
      
      const defaultContent = `% Your Resume
\\section{教育背景}
[Click + to add education sections]

\\section{实习经历}  
[Click + to add experience sections]

\\section{主要研究内容}
[Click + to add research sections]

\\section{其他学术成果}
[Click + to add publications]`;

      const hash = await cvStorage.createHashForContent(defaultContent);
      
      const newCV: CVVersion = {
        id: crypto.randomUUID(),
        title: 'Resume',
        versionNumber,
        content: defaultContent,
        format: 'latex',
        created: new Date().toISOString(),
        tags: [],
        note: `Resume v${versionNumber}`,
        hash,
        linkedApplications: []
      };

      await cvStorage.save(newCV);
      setCurrentCV(newCV);
      setEditedContent(defaultContent);
      await loadData();
    } catch (error) {
      console.error('Failed to create new CV:', error);
    }
  };

  // Default: Overwrite current version (normal editing behavior)
  const saveChanges = async () => {
    if (!currentCV) return;

    try {
      const cvStorage = new CVStorage(dataLanguage);
      
      // Check if content actually changed
      if (editedContent === currentCV.content) return;
      
      // Update current version in place
      const updatedCV: CVVersion = {
        ...currentCV,
        content: editedContent,
        updated: new Date().toISOString()
      };

      await cvStorage.save(updatedCV);
      setCurrentCV(updatedCV);
      // Clear draft after successful save
      localStorage.removeItem('resume-draft');
      await loadData();
      await loadLinkedApplications();
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('Failed to save changes');
    }
  };

  // Explicit: Create new version (branching behavior)
  const saveAsNewVersion = async () => {
    if (!currentCV) return;

    try {
      const cvStorage = new CVStorage(dataLanguage);
      
      // Check if content actually changed
      if (editedContent === currentCV.content) return;
      
      const versionNumber = await cvStorage.getNextVersionNumber();
      const hash = await cvStorage.createHashForContent(editedContent);

      const newVersion: CVVersion = {
        id: crypto.randomUUID(),
        title: currentCV.title || 'Resume',
        versionNumber,
        content: editedContent,
        format: 'latex',
        created: new Date().toISOString(),
        tags: currentCV.tags,
        note: `Resume v${versionNumber}`,
        parentId: currentCV.id,
        hash,
        linkedApplications: []
      };

      await cvStorage.save(newVersion);
      setCurrentCV(newVersion);
      await loadData();
      await loadLinkedApplications();
    } catch (error) {
      console.error('Failed to create new version:', error);
      alert('Failed to create new version');
    }
  };

  const insertSection = (section: ResumeSection) => {
    console.log('Inserting section:', section.title, 'with latexContent:', section.latexContent);
    const contentToInsert = section.latexContent || section.content || '';
    if (!contentToInsert.trim()) {
      console.warn('Section has no content to insert:', section);
      alert('This section has no content to insert');
      return;
    }
    
    // Use editor's insertAtCursor method if available
    if (editorRef?.insertAtCursor) {
      editorRef.insertAtCursor(contentToInsert);
    } else {
      // Fallback to append at end
      const newContent = editedContent + '\n\n' + contentToInsert;
      setEditedContent(newContent);
    }
    
    // Show brief success feedback
    const successEl = document.createElement('div');
    successEl.textContent = `Added: ${section.title}`;
    successEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
    document.body.appendChild(successEl);
    setTimeout(() => document.body.removeChild(successEl), 2000);
  };

  const loadVersion = (version: CVVersion) => {
    setCurrentCV(version);
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
      
      // Update current CV if it's the one being edited
      if (currentCV?.id === versionId) {
        setCurrentCV({ ...currentCV, ...updates });
      }
    } catch (error) {
      console.error('Failed to update version metadata:', error);
      alert('Failed to update version metadata');
    }
  };

  const compareWithVersion = (version: CVVersion) => {
    if (currentCV) {
      setCompareVersions([currentCV, version]);
      setShowDiff(true);
    }
  };

  const deleteVersion = async (versionId: string) => {
    const version = allVersions.find(v => v.id === versionId);
    if (!version || !confirm(`Delete "${version.title || 'Resume'}"?`)) return;
    
    try {
      const cvStorage = new CVStorage(dataLanguage);
      await cvStorage.delete(versionId);
      
      // If deleting current version, switch to another one or create new
      if (currentCV?.id === versionId) {
        const remaining = allVersions.filter(v => v.id !== versionId);
        if (remaining.length > 0) {
          const latest = remaining[0];
          setCurrentCV(latest);
          setEditedContent(latest.content);
        } else {
          // No versions left, create a new default one
          await createNewCV();
        }
      }
      
      await loadData();
      await loadLinkedApplications();
    } catch (error) {
      console.error('Failed to delete version:', error);
      alert('Failed to delete version');
    }
  };

  const exportAllResumes = async () => {
    if (allVersions.length === 0) {
      alert('No resume versions to export');
      return;
    }

    try {
      // Create a zip-like structure with all resume files
      const files: { name: string; content: string }[] = [];
      
      // Add all resume versions
      allVersions.forEach(version => {
        const filename = `${(version.title || 'Resume').replace(/[^a-zA-Z0-9]/g, '-')}-v${version.versionNumber}.tex`;
        files.push({
          name: filename,
          content: version.content
        });
      });
      
      // Also add a metadata file
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
        name: 'resume-metadata.json',
        content: JSON.stringify(metadata, null, 2)
      });
      
      // Since we can't create actual ZIP files in browser without libraries,
      // we'll create a combined export with clear file separators
      let combinedContent = '# BATCH EXPORT - ALL RESUME VERSIONS\n';
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
      a.download = `all-resumes-${new Date().toISOString().split('T')[0]}.txt`;
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
      console.error('Failed to export all resumes:', error);
      alert('Failed to export all resumes');
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
    return <div className="p-8 text-center">Loading...</div>;
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
                  placeholder="Resume title"
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
                      if (currentCV && tempTitle.trim()) {
                        const cvStorage = new CVStorage(dataLanguage);
                        const updated = { ...currentCV, title: tempTitle.trim(), note: tempNote.trim() };
                        await cvStorage.updateCV(updated.id, updated);
                        setCurrentCV(updated);
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
                  setTempTitle(currentCV?.title || 'Resume');
                  setTempNote(currentCV?.note || '');
                  setEditingMetadata(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentCV?.title || 'Resume'}
                  </h1>
                  {linkedApplications.length > 0 && (
                    <span 
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-200 transition-colors"
                      title={`Used in ${linkedApplications.length} application${linkedApplications.length > 1 ? 's' : ''}: ${linkedApplications.map(app => `${app.company} - ${app.title}`).join(', ')}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Create a simple dropdown or modal showing all linked applications
                        const appsList = linkedApplications.map(app => `• ${app.company} - ${app.title}`).join('\n');
                        alert(`🔗 This resume is linked to:\n\n${appsList}\n\nClick individual applications in the Job Applications tab to view them.`);
                      }}
                    >
                      🔗 {linkedApplications.length} app{linkedApplications.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">
                  {currentCV?.note || 'Click to edit'} • Auto-saves with version control
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            {/* Left: Primary editing actions */}
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                {editedContent !== currentCV?.content && (
                  <div className="text-xs text-amber-600">
                    ● Unsaved changes
                  </div>
                )}
                <button
                  onClick={saveChanges}
                  disabled={editedContent === currentCV?.content}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Save
                </button>
              </div>
              <button
                onClick={saveAsNewVersion}
                disabled={editedContent === currentCV?.content}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Create a copy with your changes"
              >
                Duplicate & Save
              </button>
            </div>

            {/* Right: Utility actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowSections(!showSections)}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                title="Toggle section library"
              >
                {showSections ? 'Hide' : 'Show'} Sections
              </button>
              
              <div className="relative">
                <button className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
                       onClick={(e) => {
                         const rect = e.currentTarget.getBoundingClientRect();
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
                      onClick={() => {
                        if (currentCV && allVersions.length > 1) {
                          setSelectedForComparison(currentCV);
                          setShowDocumentSelector(true);
                        }
                      }}
                      disabled={!currentCV || allVersions.length <= 1}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Compare with other resume
                    </button>
                    <button
                      onClick={() => {
                        if (currentCV) {
                          navigator.clipboard.writeText(editedContent);
                          const successEl = document.createElement('div');
                          successEl.textContent = 'Resume LaTeX copied!';
                          successEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                          document.body.appendChild(successEl);
                          setTimeout(() => document.body.removeChild(successEl), 2000);
                        }
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Copy LaTeX to clipboard
                    </button>
                    <button
                      onClick={async () => {
                        const appStorage = new ApplicationStorage();
                        const apps = await appStorage.getAll();
                        setApplications(apps);
                        setShowLinkModal(true);
                        setLinkingVersion(currentCV);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Link to job application
                    </button>
                    <button
                      onClick={exportAllResumes}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export all versions ({allVersions.length})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 mt-2">
        {/* Sections Panel */}
        {showSections && (
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-3 border-b border-gray-200">
                <h3 className="font-medium text-sm">Section Library</h3>
                <p className="text-xs text-gray-500">Click Insert to add section</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {sections.map(section => (
                  <div
                    key={section.id}
                    className="group relative h-16 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between h-full">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm">{getSectionTypeIcon(section.type)}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs truncate mb-1">{section.title}</h4>
                          <p className="text-xs text-gray-500 truncate mb-1">{section.note || 'No notes'}</p>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                            {getSectionTypeLabel(section.type)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Hover Action - Only Insert */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            insertSection(section);
                          }}
                          className="p-1.5 bg-green-600 text-white hover:bg-green-700 rounded"
                          title="Insert section at cursor"
                        >
                          ✓
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {sections.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No sections yet</p>
                    <p className="text-xs">Create some in Section Library</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Versions Panel */}
        {showVersions && (
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
                      currentCV?.id === version.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
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
                            placeholder="Resume title"
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
                              {version.title || 'Resume'}
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
                                setTempVersionTitle(version.title || 'Resume');
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
              </div>
            </div>
          </div>
        )}

        {/* Main Editor */}
        <div className={`${showSections && showVersions ? 'col-span-6' : showSections || showVersions ? 'col-span-9' : 'col-span-12'}`}>
          {currentCV ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4">
                <LaTeXEditor
                  initialContent={editedContent}
                  onChange={setEditedContent}
                  onSave={saveChanges}
                  onEditorRef={setEditorRef}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <h3 className="text-lg font-medium mb-2">No Resume</h3>
              <button
                onClick={createNewCV}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create First Resume
              </button>
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
                  Compare current resume with:
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
                    <div className="font-medium">{version.title || 'Resume'}</div>
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
          oldTitle={compareDocuments[0].title || 'Resume'}
          newTitle={compareDocuments[1].title || 'Resume'}
          onClose={() => {
            setShowDiff(false);
            setCompareDocuments(null);
          }}
        />
      )}
      
      {/* Section Preview Modal */}
      {previewSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getSectionTypeIcon(previewSection.type)}</span>
                  <div>
                    <h2 className="text-lg font-semibold">{previewSection.title}</h2>
                    <p className="text-sm text-gray-600">v{previewSection.versionNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewSection(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap border">
                {previewSection.latexContent || previewSection.content}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setPreviewSection(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  insertSection(previewSection);
                  setPreviewSection(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Insert at Cursor
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Link to Application Modal */}
      {showLinkModal && linkingVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Link Resume to Application</h2>
              <p className="text-sm text-gray-600">
                {linkingVersion.title || 'Resume'}
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
                          const updatedApp = { ...app, resumeVersionId: linkingVersion.id };
                          await appStorage.save(updatedApp);
                          await cvStorage.linkToApplication(linkingVersion.id, app.id);
                          await loadLinkedApplications(); // Refresh the linked applications
                          setShowLinkModal(false);
                          
                          // Refresh global application data for Job Applications interface
                          if ((window as any).refreshApplicationData) {
                            (window as any).refreshApplicationData();
                          }
                          
                          // Better visual feedback
                          const successEl = document.createElement('div');
                          successEl.innerHTML = `✅ Resume linked to <strong>${app.company} - ${app.title}</strong>`;
                          successEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded shadow-lg z-50 max-w-sm';
                          document.body.appendChild(successEl);
                          setTimeout(() => document.body.removeChild(successEl), 3000);
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