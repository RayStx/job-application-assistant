export interface BackupData {
  id: string;
  metadata: {
    exportDate: string;
    version: string;
    description: string;
    note?: string;
    isAutoBackup?: boolean;
  };
  // Support both languages in one backup
  zh: {
    applications: any[];
    cvVersions: any[];
    sections: any[];
  };
  en: {
    applications: any[];
    cvVersions: any[];
    sections: any[];
  };
}

export class BackupStorage {
  private storageKey = 'job-assistant-backups';
  private maxBackups = 20; // Keep last 20 backups as requested

  // Create full backup with both Chinese and English data
  async createFullLanguageBackup(description: string = 'Full backup', isAutoBackup: boolean = false): Promise<string> {
    try {
      console.log('Creating full language backup...');
      
      // Import storage classes dynamically
      const { ApplicationStorage } = await import('./applications');
      const { CVStorage } = await import('./cvStorage');
      const { SectionStorage } = await import('./sectionStorage');
      
      // Get Chinese data
      const appStorageZh = new ApplicationStorage('zh');
      const cvStorageZh = new CVStorage('zh');
      const sectionStorageZh = new SectionStorage('zh');
      
      // Get English data
      const appStorageEn = new ApplicationStorage('en');
      const cvStorageEn = new CVStorage('en');
      const sectionStorageEn = new SectionStorage('en');
      
      const [
        applicationsZh, cvVersionsZh, sectionsZh,
        applicationsEn, cvVersionsEn, sectionsEn
      ] = await Promise.all([
        appStorageZh.getAll(),
        cvStorageZh.getAll(), 
        sectionStorageZh.getAllSections(),
        appStorageEn.getAll(),
        cvStorageEn.getAll(),
        sectionStorageEn.getAllSections()
      ]);
      
      const backupId = `backup-${Date.now()}`;
      const backup: BackupData = {
        id: backupId,
        metadata: {
          exportDate: new Date().toISOString(),
          version: '2.0', // New version with dual language support
          description,
          isAutoBackup
        },
        zh: {
          applications: applicationsZh,
          cvVersions: cvVersionsZh,
          sections: sectionsZh
        },
        en: {
          applications: applicationsEn,
          cvVersions: cvVersionsEn,
          sections: sectionsEn
        }
      };
      
      console.log(`Full backup data: ZH(${applicationsZh.length} apps, ${cvVersionsZh.length} cvs, ${sectionsZh.length} sections), EN(${applicationsEn.length} apps, ${cvVersionsEn.length} cvs, ${sectionsEn.length} sections)`);
      
      // Get existing backups
      const existingBackups = await this.getAllBackups();
      
      // Add new backup
      existingBackups.unshift(backup);
      
      // Keep only latest backups
      const trimmedBackups = existingBackups.slice(0, this.maxBackups);
      
      // Check storage size before attempting to save
      const backupSize = JSON.stringify(trimmedBackups).length;
      console.log(`Full backup size: ${backupSize} characters`);
      
      if (backupSize > 4 * 1024 * 1024) { // 4MB limit for safety
        console.warn('Backup size exceeds safe limit, reducing to last 8 backups');
        const reducedBackups = trimmedBackups.slice(0, 8);
        await chrome.storage.local.set({ [this.storageKey]: reducedBackups });
      } else {
        await chrome.storage.local.set({ [this.storageKey]: trimmedBackups });
      }
      
      console.log(`Full language backup created successfully: ${backupId}`);
      return backupId;
    } catch (error) {
      console.error('Failed to create full language backup:', error);
      throw error;
    }
  }

  // Restore backup data to specified language
  async restoreBackupToLanguage(backupId: string, targetLanguage: 'zh' | 'en'): Promise<void> {
    try {
      console.log(`Restoring backup ${backupId} to ${targetLanguage} dataset`);
      
      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Import storage classes
      const { ApplicationStorage } = await import('./applications');
      const { CVStorage } = await import('./cvStorage');
      const { SectionStorage } = await import('./sectionStorage');

      const appStorage = new ApplicationStorage(targetLanguage);
      const cvStorage = new CVStorage(targetLanguage);
      const sectionStorage = new SectionStorage(targetLanguage);

      // Check if this is a new format backup (v2.0+) or legacy format
      if (backup.zh && backup.en) {
        // New format - restore from specific language data
        const sourceData = backup[targetLanguage];
        console.log(`Restoring ${sourceData.applications.length} apps, ${sourceData.cvVersions.length} cvs, ${sourceData.sections.length} sections`);
        
        // Clear existing data for target language only
        const storageKeys = [
          `job-assistant-data-${targetLanguage}`,
          `job-assistant-cv-versions-${targetLanguage}`,
          `job-assistant-resume-sections-${targetLanguage}`,
          `job-assistant-cv-compositions-${targetLanguage}`
        ];
        await chrome.storage.local.remove(storageKeys);

        // Restore data
        for (const app of sourceData.applications) {
          await appStorage.save(app);
        }
        for (const cv of sourceData.cvVersions) {
          await cvStorage.save(cv);
        }
        for (const section of sourceData.sections) {
          await sectionStorage.saveSection(section);
        }
      } else {
        // Legacy format - treat as Chinese data (backward compatibility)
        console.log('Legacy backup format detected, treating as Chinese data');
        if (targetLanguage === 'zh') {
          const legacyData = backup as any;
          if (legacyData.applications) {
            for (const app of legacyData.applications) {
              await appStorage.save(app);
            }
          }
          if (legacyData.cvVersions) {
            for (const cv of legacyData.cvVersions) {
              await cvStorage.save(cv);
            }
          }
          if (legacyData.sections) {
            for (const section of legacyData.sections) {
              await sectionStorage.saveSection(section);
            }
          }
        }
      }

      console.log(`Backup restoration to ${targetLanguage} completed`);
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  // Check if backup contains both languages (new format)
  isFullLanguageBackup(backup: BackupData): boolean {
    return !!(backup.zh && backup.en);
  }

  async createBackup(data: Omit<BackupData, 'id'>): Promise<string> {
    try {
      console.log('Starting backup creation...');
      const backupId = `backup-${Date.now()}`;
      const backup: BackupData = {
        id: backupId,
        ...data
      };

      console.log(`Backup data size: apps=${data.applications?.length || 0}, cvs=${data.cvVersions?.length || 0}, sections=${data.sections?.length || 0}`);

      // Get existing backups
      const existingBackups = await this.getAllBackups();
      console.log(`Existing backups: ${existingBackups.length}`);
      
      // Add new backup
      existingBackups.unshift(backup);
      
      // Keep only latest backups
      const trimmedBackups = existingBackups.slice(0, this.maxBackups);
      console.log(`Trimmed backups: ${trimmedBackups.length}`);
      
      // Check storage size before attempting to save
      const backupSize = JSON.stringify(trimmedBackups).length;
      console.log(`Backup size: ${backupSize} characters`);
      
      if (backupSize > 4 * 1024 * 1024) { // 4MB limit for safety
        console.warn('Backup size exceeds safe limit, reducing to last 10 backups');
        const reducedBackups = trimmedBackups.slice(0, 10);
        await chrome.storage.local.set({ [this.storageKey]: reducedBackups });
      } else {
        // Store in chrome.storage.local
        await chrome.storage.local.set({ [this.storageKey]: trimmedBackups });
      }
      
      console.log(`Backup created successfully: ${backupId}`);
      return backupId;
    } catch (error) {
      console.error('Failed to create backup:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async getAllBackups(): Promise<BackupData[]> {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      return result[this.storageKey] || [];
    } catch (error) {
      console.error('Failed to get backups:', error);
      return [];
    }
  }

  async getBackup(backupId: string): Promise<BackupData | null> {
    try {
      const backups = await this.getAllBackups();
      return backups.find(b => b.id === backupId) || null;
    } catch (error) {
      console.error('Failed to get backup:', error);
      return null;
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      const backups = await this.getAllBackups();
      const filtered = backups.filter(b => b.id !== backupId);
      await chrome.storage.local.set({ [this.storageKey]: filtered });
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }

  async exportBackupAsFile(backupId: string): Promise<void> {
    try {
      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      const jsonData = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-tracker-${backup.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export backup:', error);
      throw error;
    }
  }

  async importBackupFromFile(file: File): Promise<BackupData> {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      // Validate backup structure
      if (!backupData.metadata || !backupData.applications || !backupData.cvVersions || !backupData.sections) {
        throw new Error('Invalid backup file format');
      }

      // Store as a backup
      const backupId = await this.createBackup({
        metadata: {
          ...backupData.metadata,
          description: `Imported: ${backupData.metadata.description}`,
          exportDate: new Date().toISOString()
        },
        applications: backupData.applications,
        cvVersions: backupData.cvVersions,
        sections: backupData.sections
      });

      return await this.getBackup(backupId) as BackupData;
    } catch (error) {
      console.error('Failed to import backup:', error);
      throw error;
    }
  }

  async getStorageUsage(): Promise<{ used: number; total: number }> {
    try {
      const used = await chrome.storage.local.getBytesInUse();
      // Chrome storage.local has a limit of ~5MB per extension
      const total = 5 * 1024 * 1024; // 5MB in bytes
      return { used, total };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { used: 0, total: 5 * 1024 * 1024 };
    }
  }

  // Smart backup system - only backup if data has actually changed
  async createSmartBackup(data: Omit<BackupData, 'id'>, forceBackup = false): Promise<string | null> {
    try {
      console.log('Creating smart backup...', { forceBackup });
      
      // Validate data first
      if (!data.applications || !data.cvVersions || !data.sections) {
        console.error('Invalid backup data structure:', data);
        throw new Error('Invalid backup data: missing required arrays');
      }

      // Get latest backup to compare
      const existingBackups = await this.getAllBackups();
      const latestBackup = existingBackups[0];

      if (!forceBackup && latestBackup) {
        // Check if data has meaningfully changed
        const hasChanged = this.hasDataChanged(latestBackup, data);
        if (!hasChanged) {
          console.log('No significant changes detected, skipping backup');
          return null;
        }
      }

      // Create backup
      return await this.createBackup(data);
    } catch (error) {
      console.error('Failed to create smart backup:', error);
      throw error;
    }
  }

  private hasDataChanged(oldBackup: BackupData, newData: Omit<BackupData, 'id'>): boolean {
    // Handle new format (dual language) vs legacy format
    if (this.isFullLanguageBackup(oldBackup) && newData.zh && newData.en) {
      // Both are new format - compare both languages
      return this.hasLanguageDataChanged(oldBackup.zh, newData.zh) || 
             this.hasLanguageDataChanged(oldBackup.en, newData.en);
    } else if (!this.isFullLanguageBackup(oldBackup) && (newData as any).applications) {
      // Both are legacy format
      const oldLegacy = oldBackup as any;
      const newLegacy = newData as any;
      return this.hasLanguageDataChanged(
        { applications: oldLegacy.applications, cvVersions: oldLegacy.cvVersions, sections: oldLegacy.sections },
        { applications: newLegacy.applications, cvVersions: newLegacy.cvVersions, sections: newLegacy.sections }
      );
    } else {
      // Format mismatch - always consider changed
      return true;
    }
  }

  private hasLanguageDataChanged(oldData: { applications: any[], cvVersions: any[], sections: any[] }, 
                                newData: { applications: any[], cvVersions: any[], sections: any[] }): boolean {
    // Check if counts are different (basic change detection)
    if (oldData.applications.length !== newData.applications.length) {
      return true;
    }
    if (oldData.cvVersions.length !== newData.cvVersions.length) {
      return true;
    }
    if (oldData.sections.length !== newData.sections.length) {
      return true;
    }

    // Check for content changes in applications (basic hash comparison)
    const oldAppHashes = oldData.applications.map(app => this.hashObject(app));
    const newAppHashes = newData.applications.map(app => this.hashObject(app));
    if (!this.arraysEqual(oldAppHashes, newAppHashes)) {
      return true;
    }

    // Check for content changes in CV versions
    const oldCvHashes = oldData.cvVersions.map(cv => this.hashObject(cv));
    const newCvHashes = newData.cvVersions.map(cv => this.hashObject(cv));
    if (!this.arraysEqual(oldCvHashes, newCvHashes)) {
      return true;
    }

    // Check for content changes in sections (excluding templates)
    const oldSectionHashes = oldData.sections.filter(s => !s.isTemplate).map(s => this.hashObject(s));
    const newSectionHashes = newData.sections.filter(s => !s.isTemplate).map(s => this.hashObject(s));
    if (!this.arraysEqual(oldSectionHashes, newSectionHashes)) {
      return true;
    }

    return false;
  }

  private hashObject(obj: any): string {
    // Unicode-safe hash function for basic change detection
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 16);
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  }
}