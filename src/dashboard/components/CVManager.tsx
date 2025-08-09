import React, { useState, useEffect } from 'react';
import { CVStorage } from '@/lib/storage/cvStorage';
import { ApplicationStorage } from '@/lib/storage/applications';
import { createBlankTemplate } from '@/lib/cv/latexTemplate';
import { LaTeXEditor } from './LaTeXEditor';
import { VersionDiff } from './VersionDiff';
import { SectionEditor } from './SectionEditor';
import { CVComposer } from './CVComposer';
import type { CVVersion, JobApplication } from '@/types';

function formatDate(dateValue: any): string {
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date instanceof Date && !isNaN(date.getTime()) 
      ? date.toLocaleDateString()
      : 'Unknown date';
  } catch {
    return 'Unknown date';
  }
}

export function CVManager() {
  const [versions, setVersions] = useState<CVVersion[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<CVVersion | null>(null);
  const [editingVersion, setEditingVersion] = useState<CVVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const [diffVersions, setDiffVersions] = useState<[CVVersion, CVVersion] | null>(null);
  const [newVersionNote, setNewVersionNote] = useState('');
  const [newVersionTags, setNewVersionTags] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editingVersionNote, setEditingVersionNote] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [sectionEditorContent, setSectionEditorContent] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cvStorage = new CVStorage();
      const appStorage = new ApplicationStorage();
      const [cvVersions, apps] = await Promise.all([
        cvStorage.getAll(),
        appStorage.getAll()
      ]);
      
      setVersions(cvVersions.sort((a, b) => b.versionNumber - a.versionNumber));
      setApplications(apps);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewVersion = async () => {
    try {
      const cvStorage = new CVStorage();
      const versionNumber = await cvStorage.getNextVersionNumber();
      const content = createBlankTemplate();
      const hash = await cvStorage.createHashForContent(content);

      const newVersion: CVVersion = {
        id: crypto.randomUUID(),
        versionNumber,
        content,
        format: 'latex',
        created: new Date().toISOString(),
        tags: [],
        note: `Resume v${versionNumber}`,
        hash,
        linkedApplications: []
      };

      await cvStorage.save(newVersion);
      await loadData();
      setSelectedVersion(newVersion);
      setEditingVersion(newVersion);
      setEditedContent(content);
    } catch (error) {
      console.error('Failed to create new version:', error);
      alert('Failed to create new version');
    }
  };

  const saveEditedVersion = async () => {
    if (!editingVersion || !editedContent.trim()) return;

    try {
      const cvStorage = new CVStorage();
      const versionNumber = await cvStorage.getNextVersionNumber();
      const hash = await cvStorage.createHashForContent(editedContent);

      const newVersion: CVVersion = {
        id: crypto.randomUUID(),
        versionNumber,
        content: editedContent,
        format: 'latex',
        created: new Date().toISOString(),
        tags: newVersionTags.split(',').map(t => t.trim()).filter(t => t),
        note: newVersionNote || `Edited version ${versionNumber}`,
        parentId: editingVersion.id,
        hash,
        linkedApplications: []
      };

      await cvStorage.save(newVersion);
      await loadData();
      setEditingVersion(null);
      setSelectedVersion(newVersion);
      setNewVersionNote('');
      setNewVersionTags('');
      setEditedContent('');
    } catch (error) {
      console.error('Failed to save version:', error);
      alert('Failed to save version');
    }
  };

  const startEditing = (version: CVVersion) => {
    setEditingVersion(version);
    setEditedContent(version.content);
    setNewVersionNote('');
    setNewVersionTags('');
  };

  const exportToClipboard = async (version: CVVersion) => {
    try {
      await navigator.clipboard.writeText(version.content);
      alert('LaTeX content copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const deleteVersion = async (version: CVVersion) => {
    const linkedApps = version.linkedApplications || [];
    if (linkedApps.length > 0) {
      const proceed = confirm(`This version is linked to ${linkedApps.length} applications. Delete anyway?`);
      if (!proceed) return;
    }

    if (!confirm('Are you sure you want to delete this version?')) return;

    try {
      const cvStorage = new CVStorage();
      await cvStorage.delete(version.id);
      await loadData();
      if (selectedVersion?.id === version.id) {
        setSelectedVersion(null);
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
      alert('Failed to delete version');
    }
  };

  const compareVersions = (v1: CVVersion, v2: CVVersion) => {
    setDiffVersions([v1, v2]);
    setShowDiff(true);
  };

  const startEditingNote = (version: CVVersion) => {
    setEditingVersionNote(version.id);
    setTempNote(version.note);
  };

  const saveVersionNote = async (version: CVVersion) => {
    if (tempNote.trim() === version.note) {
      setEditingVersionNote(null);
      return;
    }

    try {
      const cvStorage = new CVStorage();
      const updatedVersion = { ...version, note: tempNote.trim() };
      await cvStorage.save(updatedVersion);
      await loadData();
      setEditingVersionNote(null);
    } catch (error) {
      console.error('Failed to update version note:', error);
      alert('Failed to update version note');
      setEditingVersionNote(null);
    }
  };

  const getApplicationsForVersion = (versionId: string) => {
    return applications.filter(app => app.resumeVersionId === versionId);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading resume versions...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resume Version Control</h1>
            <p className="text-gray-600 mt-1">Manage your LaTeX resume versions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowComposer(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Compose from Sections
            </button>
            <button
              onClick={createNewVersion}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create from Template
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold">Versions ({versions.length})</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {versions.map(version => {
                const linkedApps = getApplicationsForVersion(version.id);
                return (
                  <div
                    key={version.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedVersion?.id === version.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          Version {version.versionNumber}
                        </h3>
                        {editingVersionNote === version.id ? (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={tempNote}
                              onChange={(e) => setTempNote(e.target.value)}
                              onBlur={() => saveVersionNote(version)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveVersionNote(version);
                                } else if (e.key === 'Escape') {
                                  setEditingVersionNote(null);
                                }
                              }}
                              className="w-full text-sm px-2 py-1 border border-gray-300 rounded"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <p 
                            className="text-sm text-gray-600 cursor-pointer hover:text-blue-600"
                            onClick={() => startEditingNote(version)}
                            title="Click to edit version name"
                          >
                            {version.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(version.created)}
                        </p>
                        {linkedApps.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            Used in {linkedApps.length} applications
                          </p>
                        )}
                        {version.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {version.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {versions.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No resume versions yet. Create your first version to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedVersion ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Version {selectedVersion.versionNumber}
                    </h2>
                    <p className="text-sm text-gray-600">{selectedVersion.note}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(selectedVersion)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Edit LaTeX
                    </button>
                    <button
                      onClick={() => {
                        setSectionEditorContent(selectedVersion.content);
                        setShowSectionEditor(true);
                      }}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      Edit Sections
                    </button>
                    <button
                      onClick={() => exportToClipboard(selectedVersion)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Copy LaTeX
                    </button>
                    {versions.length > 1 && (
                      <select
                        onChange={(e) => {
                          const otherId = e.target.value;
                          if (otherId) {
                            const otherVersion = versions.find(v => v.id === otherId);
                            if (otherVersion) {
                              compareVersions(selectedVersion, otherVersion);
                            }
                          }
                        }}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                        defaultValue=""
                      >
                        <option value="">Compare with...</option>
                        {versions
                          .filter(v => v.id !== selectedVersion.id)
                          .map(v => (
                            <option key={v.id} value={v.id}>
                              Version {v.versionNumber}
                            </option>
                          ))}
                      </select>
                    )}
                    <button
                      onClick={() => deleteVersion(selectedVersion)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap bg-gray-50 p-4 rounded border">
                  {selectedVersion.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              Select a version to view its content
            </div>
          )}
        </div>
      </div>

      {editingVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                Edit Version {editingVersion.versionNumber}
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version Note
                  </label>
                  <input
                    type="text"
                    value={newVersionNote}
                    onChange={(e) => setNewVersionNote(e.target.value)}
                    placeholder="Brief description of changes"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newVersionTags}
                    onChange={(e) => setNewVersionTags(e.target.value)}
                    placeholder="tech, manager, creative"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
              <LaTeXEditor
                initialContent={editedContent}
                onChange={setEditedContent}
                onSave={saveEditedVersion}
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setEditingVersion(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedVersion}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!editedContent.trim()}
              >
                Save as New Version
              </button>
            </div>
          </div>
        </div>
      )}

      {showDiff && diffVersions && (
        <VersionDiff
          oldVersion={diffVersions[0]}
          newVersion={diffVersions[1]}
          onClose={() => setShowDiff(false)}
        />
      )}

      {showSectionEditor && (
        <SectionEditor
          content={sectionEditorContent}
          onChange={async (newContent) => {
            if (selectedVersion) {
              try {
                const cvStorage = new CVStorage();
                const versionNumber = await cvStorage.getNextVersionNumber();
                const hash = await cvStorage.createHashForContent(newContent);

                const newVersion: CVVersion = {
                  id: crypto.randomUUID(),
                  versionNumber,
                  content: newContent,
                  format: 'latex',
                  created: new Date().toISOString(),
                  tags: selectedVersion.tags,
                  note: `${selectedVersion.note} (section edited)`,
                  parentId: selectedVersion.id,
                  hash,
                  linkedApplications: []
                };

                await cvStorage.save(newVersion);
                await loadData();
                setSelectedVersion(newVersion);
                setShowSectionEditor(false);
              } catch (error) {
                console.error('Failed to save edited sections:', error);
                alert('Failed to save changes');
              }
            }
          }}
          onClose={() => setShowSectionEditor(false)}
        />
      )}

      {showComposer && (
        <CVComposer
          onClose={() => setShowComposer(false)}
          onSave={loadData}
        />
      )}
    </div>
  );
}