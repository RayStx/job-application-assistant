import type { JobApplication, StorageData } from '@/types';

export class ApplicationStorage {
  private static readonly BASE_STORAGE_KEY = 'job-assistant-data';
  private language: 'zh' | 'en' = 'zh'; // Default to Chinese
  
  constructor(language: 'zh' | 'en' = 'zh') {
    this.language = language;
    // Migrate existing data on first initialization
    this.migrateExistingData();
  }
  
  // Migrate existing data from old unified storage to language-specific storage
  private async migrateExistingData() {
    try {
      const oldKey = ApplicationStorage.BASE_STORAGE_KEY;
      const result = await chrome.storage.local.get(oldKey);
      const oldData = result[oldKey];
      
      if (oldData && oldData.applications) {
        // Check if migration already happened
        const newKeyZh = `${ApplicationStorage.BASE_STORAGE_KEY}-zh`;
        const existingZh = await chrome.storage.local.get(newKeyZh);
        
        if (!existingZh[newKeyZh]) {
          // Migrate to Chinese data set (default for existing users)
          console.log('Migrating existing data to Chinese dataset...');
          await chrome.storage.local.set({
            [newKeyZh]: oldData
          });
          
          // Remove old data after successful migration
          await chrome.storage.local.remove(oldKey);
          console.log('Data migration completed successfully');
        }
      }
    } catch (error) {
      console.error('Failed to migrate existing data:', error);
    }
  }
  
  private get STORAGE_KEY() {
    return `${ApplicationStorage.BASE_STORAGE_KEY}-${this.language}`;
  }

  async getAll(): Promise<JobApplication[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const data: StorageData = result[this.STORAGE_KEY] || { applications: [], cvs: [], config: {} };
      return data.applications || [];
    } catch (error) {
      console.error('Failed to get applications:', error);
      return [];
    }
  }

  async save(application: JobApplication): Promise<void> {
    try {
      const data = await this.getStorageData();
      const existingIndex = data.applications.findIndex(app => app.id === application.id);
      
      if (existingIndex >= 0) {
        data.applications[existingIndex] = {
          ...application,
          updatedAt: new Date().toISOString()
        };
      } else {
        data.applications.push({
          ...application,
          createdAt: application.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      await chrome.storage.local.set({
        [this.STORAGE_KEY]: data
      });
    } catch (error) {
      console.error('Failed to save application:', error);
      throw new Error('Could not save job application');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const data = await this.getStorageData();
      data.applications = data.applications.filter(app => app.id !== id);
      
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: data
      });
    } catch (error) {
      console.error('Failed to delete application:', error);
      throw new Error('Could not delete job application');
    }
  }

  async getById(id: string): Promise<JobApplication | null> {
    const applications = await this.getAll();
    return applications.find(app => app.id === id) || null;
  }

  async updateStatus(id: string, status: JobApplication['status']): Promise<void> {
    try {
      const application = await this.getById(id);
      if (!application) {
        throw new Error('Application not found');
      }

      await this.save({
        ...application,
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update application status:', error);
      throw new Error('Could not update application status');
    }
  }

  private async getStorageData(): Promise<StorageData> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      return result[this.STORAGE_KEY] || { applications: [], cvs: [], config: {} };
    } catch (error) {
      console.error('Failed to get storage data:', error);
      return { applications: [], cvs: [], config: {} };
    }
  }

  async getConfig(): Promise<StorageData['config']> {
    const data = await this.getStorageData();
    return data.config;
  }

  async saveConfig(config: Partial<StorageData['config']>): Promise<void> {
    try {
      const data = await this.getStorageData();
      data.config = { ...data.config, ...config };
      
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: data
      });
    } catch (error) {
      console.error('Failed to save config:', error);
      throw new Error('Could not save configuration');
    }
  }
}