import React from 'react';

interface DocumentDiffProps {
  oldContent: string;
  newContent: string;
  oldTitle: string;
  newTitle: string;
  onClose: () => void;
}

export function DocumentDiff({ oldContent, newContent, oldTitle, newTitle, onClose }: DocumentDiffProps) {
  // Add keyboard shortcut support
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  // Improved diff algorithm with better change detection
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  // Create diff result using LCS (Longest Common Subsequence) approach
  const diffLines: { oldLine?: string; newLine?: string; type: 'same' | 'changed' | 'added' | 'removed'; lineNumber: number; oldLineNumber?: number; newLineNumber?: number }[] = [];
  
  // Simple LCS-based diff implementation
  const lcs = computeLCS(oldLines, newLines);
  
  let oldIndex = 0;
  let newIndex = 0;
  let lineNumber = 0;
  
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    lineNumber++;
    
    if (oldIndex < oldLines.length && newIndex < newLines.length) {
      const oldLine = oldLines[oldIndex];
      const newLine = newLines[newIndex];
      
      if (oldLine === newLine) {
        // Lines are identical
        diffLines.push({ 
          oldLine, 
          newLine, 
          type: 'same', 
          lineNumber,
          oldLineNumber: oldIndex + 1,
          newLineNumber: newIndex + 1
        });
        oldIndex++;
        newIndex++;
      } else {
        // Check if this is a modification or insertion/deletion
        const similarity = calculateStringSimilarity(oldLine, newLine);
        
        if (similarity > 0.3) { // If lines are >30% similar, treat as modification
          diffLines.push({ 
            oldLine, 
            newLine, 
            type: 'changed', 
            lineNumber,
            oldLineNumber: oldIndex + 1,
            newLineNumber: newIndex + 1
          });
          oldIndex++;
          newIndex++;
        } else {
          // Check which one to process first based on LCS
          const nextOldInNew = newLines.indexOf(oldLine, newIndex);
          const nextNewInOld = oldLines.indexOf(newLine, oldIndex);
          
          if (nextOldInNew !== -1 && (nextNewInOld === -1 || nextOldInNew - newIndex < nextNewInOld - oldIndex)) {
            // Old line appears later in new, so this new line is an insertion
            diffLines.push({ 
              newLine, 
              type: 'added', 
              lineNumber,
              newLineNumber: newIndex + 1
            });
            newIndex++;
          } else if (nextNewInOld !== -1) {
            // New line appears later in old, so this old line is a deletion
            diffLines.push({ 
              oldLine, 
              type: 'removed', 
              lineNumber,
              oldLineNumber: oldIndex + 1
            });
            oldIndex++;
          } else {
            // No clear match, treat as modification
            diffLines.push({ 
              oldLine, 
              newLine, 
              type: 'changed', 
              lineNumber,
              oldLineNumber: oldIndex + 1,
              newLineNumber: newIndex + 1
            });
            oldIndex++;
            newIndex++;
          }
        }
      }
    } else if (oldIndex < oldLines.length) {
      // Remaining lines in old (removed)
      diffLines.push({ 
        oldLine: oldLines[oldIndex], 
        type: 'removed', 
        lineNumber,
        oldLineNumber: oldIndex + 1
      });
      oldIndex++;
    } else {
      // Remaining lines in new (added)
      diffLines.push({ 
        newLine: newLines[newIndex], 
        type: 'added', 
        lineNumber,
        newLineNumber: newIndex + 1
      });
      newIndex++;
    }
  }

  // Helper function to compute Longest Common Subsequence
  function computeLCS(a: string[], b: string[]): number[][] {
    const matrix: number[][] = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
    
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
      }
    }
    
    return matrix;
  }
  
  // Helper function to calculate string similarity (simple implementation)
  function calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  // Helper function for Levenshtein distance
  function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str1.length + 1).fill(null).map(() => Array(str2.length + 1).fill(0));
    
    for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    return matrix[str1.length][str2.length];
  }

  // Helper function for word-level diff
  function computeWordDiff(oldText: string, newText: string): { removed: Set<string>; added: Set<string> } {
    const oldWords = new Set(oldText.split(/\s+/).filter(w => w.length > 0));
    const newWords = new Set(newText.split(/\s+/).filter(w => w.length > 0));
    
    const removed = new Set([...oldWords].filter(word => !newWords.has(word)));
    const added = new Set([...newWords].filter(word => !oldWords.has(word)));
    
    return { removed, added };
  }

  // Helper function to render inline changes
  function renderInlineChanges(text: string, highlightWords: Set<string>) {
    if (highlightWords.size === 0) return text;
    
    const words = text.split(/(\s+)/);
    return (
      <span>
        {words.map((word, idx) => {
          const cleanWord = word.trim();
          if (highlightWords.has(cleanWord)) {
            return (
              <span key={idx} className="bg-opacity-50 bg-yellow-600 px-1 rounded">
                {word}
              </span>
            );
          }
          return word;
        })}
      </span>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Compare Documents</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
          <div className="flex gap-8 mt-2 text-sm">
            <span className="text-red-600">← {oldTitle}</span>
            <span className="text-green-600">→ {newTitle}</span>
          </div>
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm">
            {diffLines.map((diff, index) => {
              const lineNum = String(diff.lineNumber || index + 1).padStart(3, ' ');
              
              if (diff.type === 'same') {
                return (
                  <div key={index} className="text-gray-300 leading-relaxed">
                    <span className="text-gray-600 mr-3">{lineNum}</span>
                    <span className="text-gray-500 mr-2"> </span>
                    {diff.oldLine}
                  </div>
                );
              } else if (diff.type === 'added') {
                return (
                  <div key={index} className="text-green-400 bg-green-900 bg-opacity-30 leading-relaxed px-1">
                    <span className="text-gray-600 mr-3">{lineNum}</span>
                    <span className="text-green-500 mr-2">+</span>
                    {diff.newLine}
                  </div>
                );
              } else if (diff.type === 'removed') {
                return (
                  <div key={index} className="text-red-400 bg-red-900 bg-opacity-30 leading-relaxed px-1">
                    <span className="text-gray-600 mr-3">{lineNum}</span>
                    <span className="text-red-500 mr-2">-</span>
                    {diff.oldLine}
                  </div>
                );
              } else if (diff.type === 'changed') {
                // Show inline word-level changes for modified lines
                const wordDiff = computeWordDiff(diff.oldLine || '', diff.newLine || '');
                return (
                  <div key={index} className="bg-yellow-900 bg-opacity-20 leading-relaxed px-1">
                    <div className="flex">
                      <span className="text-gray-600 mr-3">{lineNum}</span>
                      <span className="text-yellow-500 mr-2">~</span>
                      <div className="flex-1">
                        <div className="text-red-400 mb-1">
                          <span className="text-red-500 mr-2">- </span>
                          {renderInlineChanges(diff.oldLine || '', wordDiff.removed)}
                        </div>
                        <div className="text-green-400">
                          <span className="text-green-500 mr-2">+ </span>
                          {renderInlineChanges(diff.newLine || '', wordDiff.added)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Lines: {diffLines.filter(d => d.type === 'same').length} unchanged, 
            <span className="text-green-600 font-medium"> {diffLines.filter(d => d.type === 'added').length} added</span>, 
            <span className="text-red-600 font-medium"> {diffLines.filter(d => d.type === 'removed').length} removed</span>, 
            <span className="text-yellow-600 font-medium"> {diffLines.filter(d => d.type === 'changed').length} modified</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}