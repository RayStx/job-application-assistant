import { diffLines, Change } from 'diff';

export interface DiffResult {
  changes: Change[];
  addedLines: number;
  removedLines: number;
  unchangedLines: number;
}

export class DiffEngine {
  static compareVersions(oldContent: string, newContent: string): DiffResult {
    const changes = diffLines(oldContent, newContent);
    
    let addedLines = 0;
    let removedLines = 0;
    let unchangedLines = 0;

    changes.forEach(change => {
      const lineCount = change.value.split('\n').length - 1;
      
      if (change.added) {
        addedLines += lineCount;
      } else if (change.removed) {
        removedLines += lineCount;
      } else {
        unchangedLines += lineCount;
      }
    });

    return {
      changes,
      addedLines,
      removedLines,
      unchangedLines
    };
  }

  static formatDiffForDisplay(changes: Change[]): string {
    return changes.map(change => {
      const lines = change.value.split('\n').filter(line => line.length > 0);
      
      return lines.map(line => {
        if (change.added) {
          return `+ ${line}`;
        } else if (change.removed) {
          return `- ${line}`;
        } else {
          return `  ${line}`;
        }
      }).join('\n');
    }).join('\n');
  }

  static getDiffStats(result: DiffResult): string {
    const { addedLines, removedLines } = result;
    
    if (addedLines === 0 && removedLines === 0) {
      return 'No changes';
    }
    
    const parts = [];
    if (addedLines > 0) {
      parts.push(`+${addedLines} additions`);
    }
    if (removedLines > 0) {
      parts.push(`-${removedLines} deletions`);
    }
    
    return parts.join(', ');
  }
}