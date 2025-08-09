import type { CVVersion, StorageData } from '@/types';

export class CVStorage {
  private baseStorageKey = 'job-assistant-cv-versions';
  private language: 'zh' | 'en' = 'zh'; // Default to Chinese
  
  constructor(language: 'zh' | 'en' = 'zh') {
    this.language = language;
    // Migrate existing data on first initialization
    this.migrateExistingData();
  }
  
  private get storageKey() {
    return `${this.baseStorageKey}-${this.language}`;
  }
  
  // Migrate existing data from old unified storage to language-specific storage
  private async migrateExistingData() {
    try {
      const oldKey = 'job-assistant-cv-versions';
      const result = await chrome.storage.local.get(oldKey);
      const oldData = result[oldKey];
      
      if (oldData && Array.isArray(oldData) && oldData.length > 0) {
        // Check if migration already happened
        const newKeyZh = `${this.baseStorageKey}-zh`;
        const existingZh = await chrome.storage.local.get(newKeyZh);
        
        if (!existingZh[newKeyZh]) {
          // Migrate to Chinese data set (default for existing users)
          console.log('Migrating existing CV data to Chinese dataset...');
          await chrome.storage.local.set({
            [newKeyZh]: oldData
          });
          
          // Remove old data after successful migration
          await chrome.storage.local.remove(oldKey);
          console.log('CV data migration completed successfully');
        }
      }
    } catch (error) {
      console.error('Failed to migrate existing CV data:', error);
    }
  }

  async getAll(): Promise<CVVersion[]> {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      return result[this.storageKey] || [];
    } catch (error) {
      console.error('Failed to load CV versions:', error);
      return [];
    }
  }

  async getById(id: string): Promise<CVVersion | null> {
    const versions = await this.getAll();
    return versions.find(v => v.id === id) || null;
  }

  async save(version: CVVersion): Promise<void> {
    try {
      const versions = await this.getAll();
      const existingIndex = versions.findIndex(v => v.id === version.id);
      
      if (existingIndex >= 0) {
        versions[existingIndex] = version;
      } else {
        versions.push(version);
      }
      
      await chrome.storage.local.set({ [this.storageKey]: versions });
    } catch (error) {
      console.error('Failed to save CV version:', error);
      throw error;
    }
  }

  async updateCV(id: string, updates: Partial<CVVersion>): Promise<void> {
    try {
      const versions = await this.getAll();
      const index = versions.findIndex(v => v.id === id);
      
      if (index >= 0) {
        versions[index] = { ...versions[index], ...updates };
        await chrome.storage.local.set({ [this.storageKey]: versions });
      }
    } catch (error) {
      console.error('Failed to update CV:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const versions = await this.getAll();
      const filtered = versions.filter(v => v.id !== id);
      await chrome.storage.local.set({ [this.storageKey]: filtered });
    } catch (error) {
      console.error('Failed to delete CV version:', error);
      throw error;
    }
  }

  async getNextVersionNumber(): Promise<number> {
    const versions = await this.getAll();
    if (versions.length === 0) return 1;
    return Math.max(...versions.map(v => v.versionNumber)) + 1;
  }

  async linkToApplication(versionId: string, applicationId: string): Promise<void> {
    const version = await this.getById(versionId);
    if (!version) throw new Error('Version not found');
    
    // Initialize linkedApplications if it doesn't exist
    if (!version.linkedApplications || !Array.isArray(version.linkedApplications)) {
      version.linkedApplications = [];
    }
    
    if (!version.linkedApplications.includes(applicationId)) {
      version.linkedApplications.push(applicationId);
      await this.save(version);
    }
  }

  async unlinkFromApplication(versionId: string, applicationId: string): Promise<void> {
    const version = await this.getById(versionId);
    if (!version) return;
    
    // Initialize linkedApplications if it doesn't exist
    if (!version.linkedApplications || !Array.isArray(version.linkedApplications)) {
      version.linkedApplications = [];
    }
    
    version.linkedApplications = version.linkedApplications.filter(id => id !== applicationId);
    await this.save(version);
  }

  async getVersionsForApplication(applicationId: string): Promise<CVVersion[]> {
    const versions = await this.getAll();
    return versions.filter(v => v.linkedApplications && Array.isArray(v.linkedApplications) && v.linkedApplications.includes(applicationId));
  }

  async createHashForContent(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}