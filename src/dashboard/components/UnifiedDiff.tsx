import React from 'react';

interface UnifiedDiffProps {
  oldContent: string;
  newContent: string;
  oldTitle: string;
  newTitle: string;
  onClose: () => void;
}

export function UnifiedDiff({ oldContent, newContent, oldTitle, newTitle, onClose }: UnifiedDiffProps) {
  // Simple diff implementation - just highlight differences side by side
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const maxLines = Math.max(oldLines.length, newLines.length);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Compare Versions</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3 text-red-600">{oldTitle} (Previous)</h3>
              <div className="bg-red-50 p-4 rounded text-sm whitespace-pre-wrap h-80 overflow-y-auto border font-mono">
                {oldContent}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-green-600">{newTitle} (Current)</h3>
              <div className="bg-green-50 p-4 rounded text-sm whitespace-pre-wrap h-80 overflow-y-auto border font-mono">
                {newContent}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}