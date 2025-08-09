import React, { useState } from 'react';

interface HelpTipsProps {
  show: boolean;
  onClose: () => void;
}

export function HelpTips({ show, onClose }: HelpTipsProps) {
  const [activeTab, setActiveTab] = useState('keyboard');

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Help & Tips</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Tabs */}
          <div className="w-1/4 bg-gray-50 p-4 border-r border-gray-200">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('keyboard')}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  activeTab === 'keyboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                ⌨️ Keyboard Shortcuts
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  activeTab === 'features'
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                ✨ Features Guide
              </button>
              <button
                onClick={() => setActiveTab('tips')}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  activeTab === 'tips'
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                💡 Tips & Tricks
              </button>
              <button
                onClick={() => setActiveTab('backup')}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  activeTab === 'backup'
                    ? 'bg-blue-100 text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                💾 Backup System
              </button>
            </div>
          </div>

          {/* Content - Fixed height to prevent window resizing */}
          <div className="flex-1 p-6 h-[60vh] overflow-y-auto">
            {activeTab === 'keyboard' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Keyboard Shortcuts</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Save Changes</span>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-sm">Ctrl/Cmd + S</kbd>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Close Modal/Dialog</span>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-sm">Escape</kbd>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Navigate Tabs</span>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-sm">Ctrl/Cmd + 1-4</kbd>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>Quick Copy Text</span>
                    <kbd className="bg-gray-100 px-2 py-1 rounded text-sm">Ctrl/Cmd + C</kbd>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Features Guide</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-600">Resume & Cover Letter</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Create, edit, and version control your resumes and cover letters with LaTeX support.
                      Each document is independent - no more version confusion!
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-green-600">Section Library</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Build reusable resume sections (education, experience, etc.) and insert them into your documents.
                      Now with LaTeX editor for consistent formatting!
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-600">Job Applications</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Track your job applications and link them to specific resume/cover letter versions.
                      Import job postings automatically with the browser popup.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-orange-600">Document Comparison</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Compare any two documents with advanced diff highlighting.
                      See exactly what changed between versions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tips' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tips & Tricks</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-medium text-blue-800">💡 Efficient Workflow</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      1. Create sections in Library first<br/>
                      2. Build your base resume<br/>
                      3. Create targeted versions for different job types<br/>
                      4. Link specific versions to applications
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <h4 className="font-medium text-green-800">🔄 Version Strategy</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Use "Save Changes" for small edits, "Save as New Version" when targeting different job types.
                      Each document is independent - no parent-child relationships.
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <h4 className="font-medium text-purple-800">📋 Organization</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Name your versions clearly (e.g., "Software Dev Resume", "Data Science Resume").
                      Use the notes field to remember the target audience.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Smart Backup System</h3>
                <div className="space-y-3">
                  <div className="bg-green-50 p-3 rounded">
                    <h4 className="font-medium text-green-800">🔄 Automatic Backups</h4>
                    <p className="text-sm text-green-700 mt-1">
                      The system automatically creates backups when you open/close the extension.
                      Only creates backups when your data has actually changed - no clutter!
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-medium text-blue-800">💾 Storage Limit</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Keeps up to 20 backups total (15 automatic + 5 manual).
                      Older backups are automatically cleaned up to save space.
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <h4 className="font-medium text-yellow-800">📤 Export/Import</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Export your data anytime from the Backup Manager.
                      Import previously exported data to restore or transfer between devices.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}