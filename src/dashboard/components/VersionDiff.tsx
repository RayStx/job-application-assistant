import React from 'react';
import { DiffEngine } from '@/lib/cv/diffEngine';
import type { CVVersion } from '@/types';

interface VersionDiffProps {
  oldVersion: CVVersion;
  newVersion: CVVersion;
  onClose: () => void;
}

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

export function VersionDiff({ oldVersion, newVersion, onClose }: VersionDiffProps) {
  const diffResult = DiffEngine.compareVersions(oldVersion.content, newVersion.content);
  const stats = DiffEngine.getDiffStats(diffResult);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Changes</h2>
            <p className="text-sm text-gray-600">
              {oldVersion.note || `Version ${oldVersion.versionNumber}`} → {newVersion.note || `Version ${newVersion.versionNumber}`}
            </p>
            <p className="text-sm text-gray-500">{stats}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 overflow-auto max-h-[70vh]">
          <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm">
            {diffResult.changes.map((change, index) => {
              const lines = change.value.split('\n');
              return lines.map((line, lineIndex) => {
                if (!line.trim() && line !== '') return (
                  <div key={`${index}-${lineIndex}`} className="h-4"></div>
                );
                
                let className = 'text-gray-300 leading-relaxed';
                let prefix = ' ';
                
                if (change.added) {
                  className = 'text-green-400 bg-green-900 bg-opacity-30';
                  prefix = '+';
                } else if (change.removed) {
                  className = 'text-red-400 bg-red-900 bg-opacity-30';
                  prefix = '-';
                }
                
                return (
                  <div
                    key={`${index}-${lineIndex}`}
                    className={className}
                  >
                    <span className="text-gray-500 mr-2">{prefix}</span>
                    {line || ' '}
                  </div>
                );
              });
            })}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}