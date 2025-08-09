import React, { useState, useEffect } from 'react';
import { ApplicationStorage } from '@/lib/storage/applications';
import { CVStorage } from '@/lib/storage/cvStorage';
import { SectionStorage } from '@/lib/storage/sectionStorage';
import { BackupStorage } from '@/lib/storage/backupStorage';
import { SimpleCV } from './components/SimpleCV';
import { SectionLibrary } from './components/SectionLibrary';
import { CoverLetter } from './components/CoverLetter';
import { HelpTips } from './components/HelpTips';
import { getDocumentDisplayName, getDocumentVersionDisplay } from '@/lib/utils/applicationLinking';
import { useTranslation, initializeLanguage } from '@/lib/i18n';
import type { JobApplication, CVVersion } from '@/types';

export function App() {
  const { t, currentLanguage, setLanguage } = useTranslation();
  const [dataLanguage, setDataLanguage] = useState<'zh' | 'en'>('zh'); // Separate data language from UI language
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [cvVersions, setCvVersions] = useState<CVVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'applications' | 'resume' | 'library' | 'cover-letter'>('applications');
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [backupStorage] = useState(new BackupStorage());
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [initialDataSnapshot, setInitialDataSnapshot] = useState<any>(null);
  
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate data structure
      if (!importData.applications || !importData.cvVersions || !importData.sections) {
        throw new Error('Invalid backup file format');
      }

      const confirmRestore = confirm(
        `This will replace all existing data with the backup from ${new Date(importData.metadata?.exportDate || Date.now()).toLocaleDateString()}.\n\n` +
        `Backup contains:\n` +
        `• ${importData.applications.length} applications\n` +
        `• ${importData.cvVersions.length} resume/cover letter versions\n` +
        `• ${importData.sections.length} library sections\n\n` +
        `Continue with restore?`
      );

      if (!confirmRestore) return;

      // Clear existing data and restore from backup
      const appStorage = new ApplicationStorage(dataLanguage);
      const cvStorage = new CVStorage(dataLanguage);
      const sectionStorage = new SectionStorage(dataLanguage);

      // Clear existing data
      await chrome.storage.local.clear();

      // Restore applications
      for (const app of importData.applications) {
        await appStorage.save(app);
      }

      // Restore CV versions
      for (const cv of importData.cvVersions) {
        await cvStorage.save(cv);
      }

      // Restore sections
      for (const section of importData.sections) {
        await sectionStorage.saveSection(section);
      }

      // Reload the application data
      await loadApplications();

      alert(`Successfully restored ${importData.applications.length} applications, ${importData.cvVersions.length} resume versions, and ${importData.sections.length} sections from backup!`);

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check that the file is a valid backup file.');
      event.target.value = '';
    }
  };

  const handleExportData = async () => {
    try {
      const appStorage = new ApplicationStorage(dataLanguage);
      const cvStorage = new CVStorage(dataLanguage);
      const sectionStorage = new SectionStorage(dataLanguage);
      
      const [applications, cvVersions, sections] = await Promise.all([
        appStorage.getAll(),
        cvStorage.getAll(),
        sectionStorage.getAllSections()
      ]);
      
      const exportDataObject = {
        metadata: {
          exportDate: new Date().toISOString(),
          version: '1.0',
          description: 'Job Application Tracker Data Export'
        },
        applications: applications.map(app => ({
          id: app.id,
          title: app.title,
          company: app.company,
          status: app.status,
          dateApplied: app.dateApplied,
          location: app.location,
          workType: app.workType,
          salary: app.salary,
          description: app.description,
          requirements: app.requirements,
          resumeVersionId: app.resumeVersionId,
          notes: app.notes,
          contacts: app.contacts,
          interviews: app.interviews,
          created: app.created,
          updated: app.updated
        })),
        cvVersions: cvVersions.map(cv => ({
          id: cv.id,
          title: cv.title,
          type: cv.type || 'resume',
          versionNumber: cv.versionNumber,
          content: cv.content,
          note: cv.note,
          created: cv.created,
          parentId: cv.parentId,
          linkedApplications: cv.linkedApplications || []
        })),
        sections: sections.map(section => ({
          id: section.id,
          type: section.type,
          title: section.title,
          content: section.content,
          latexContent: section.latexContent,
          tags: section.tags,
          versionNumber: section.versionNumber,
          parentId: section.parentId,
          isTemplate: section.isTemplate,
          created: section.created,
          updated: section.updated
        }))
      };
      
      const jsonData = JSON.stringify(exportDataObject, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setLastBackupTime(new Date().toISOString());
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please check the console for details.');
    }
  };

  useEffect(() => {
    // Initialize language first
    initializeLanguage().then(() => {
      loadApplications();
      setupEventBasedBackup();
      setupKeyboardShortcuts();
    });
  }, []);

  const setupKeyboardShortcuts = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab navigation with Ctrl/Cmd + number
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            setActiveTab('applications');
            break;
          case '2':
            event.preventDefault();
            setActiveTab('resume');
            break;
          case '3':
            event.preventDefault();
            setActiveTab('library');
            break;
          case '4':
            event.preventDefault();
            setActiveTab('cover-letter');
            break;
          case 'h':
            event.preventDefault();
            setShowHelpModal(true);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  };

  const setupEventBasedBackup = () => {
    // Create initial snapshot when app opens
    setTimeout(async () => {
      try {
        const appStorage = new ApplicationStorage(dataLanguage);
        const cvStorage = new CVStorage(dataLanguage);
        const sectionStorage = new SectionStorage(dataLanguage);

        const [applications, cvVersions, sections] = await Promise.all([
          appStorage.getAll(),
          cvStorage.getAll(),
          sectionStorage.getAllSections()
        ]);

        // Store initial snapshot for comparison on close
        setInitialDataSnapshot({ applications, cvVersions, sections });

        // No backup on open - only store initial snapshot for comparison
      } catch (error) {
        console.error('Failed to create backup on open:', error);
      }
    }, 2000); // 2 seconds after load

    // Setup more aggressive backup listeners for better reliability
    const handleBeforeUnload = (event?: BeforeUnloadEvent) => {
      try {
        // Check if we have unsaved changes that need backup
        const hasChanges = checkForUnsavedChanges();
        
        if (hasChanges && event) {
          // Show browser's built-in confirmation dialog
          event.preventDefault();
          const message = t('backup.unsavedChanges');
          event.returnValue = message;
          
          // Also try to create emergency backup
          createBackupOnCloseSync();
          
          return message;
        } else if (hasChanges) {
          // Fallback for non-event calls
          const shouldBackup = confirm(t('backup.confirmBackup'));
          if (shouldBackup) {
            createBackupOnCloseSync();
          }
        }
        
        console.log('Backup check completed on page unload');
      } catch (error) {
        console.error('Backup on close failed:', error);
      }
    };

    const handleAsync = async () => {
      try {
        await createBackupOnClose();
        console.log('Auto-backup completed');
      } catch (error) {
        console.error('Async backup failed:', error);
      }
    };

    // Add event listeners for various close scenarios
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleAsync);
    window.addEventListener('unload', handleBeforeUnload);
    
    // More aggressive visibility change tracking
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        setTimeout(() => handleAsync(), 50);
      }
    });

    // Backup when user clicks browser back/forward
    window.addEventListener('popstate', () => {
      setTimeout(() => handleAsync(), 100);
    });

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleAsync);
      window.removeEventListener('unload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleAsync);
      window.removeEventListener('popstate', handleAsync);
    };
  };

  const createBackupOnClose = async () => {
    try {
      if (!initialDataSnapshot) {
        console.log('No initial snapshot available, skipping backup on close');
        return;
      }

      const appStorage = new ApplicationStorage(dataLanguage);
      const cvStorage = new CVStorage(dataLanguage);
      const sectionStorage = new SectionStorage(dataLanguage);

      const [currentApplications, currentCvVersions, currentSections] = await Promise.all([
        appStorage.getAll(),
        cvStorage.getAll(),
        sectionStorage.getAllSections()
      ]);

      // Only backup if there's actual data
      if (currentApplications.length === 0 && currentCvVersions.length === 0 && currentSections.filter(s => !s.isTemplate).length === 0) {
        console.log('No data to backup');
        return;
      }

      // Create full language auto-backup
      const backupId = await backupStorage.createFullLanguageBackup('Auto-backup on close', true);

      if (backupId) {
        // Clean up old auto-backups (keep only last 15 auto-backups + 5 manual = 20 total)
        const existingBackups = await backupStorage.getAllBackups();
        const autoBackups = existingBackups
          .filter(b => b.metadata.isAutoBackup)
          .sort((a, b) => new Date(b.metadata.exportDate).getTime() - new Date(a.metadata.exportDate).getTime());
        
        if (autoBackups.length > 15) {
          for (const oldBackup of autoBackups.slice(15)) {
            await backupStorage.deleteBackup(oldBackup.id);
          }
        }

        setLastBackupTime(new Date().toISOString());
        console.log('Backup on close created successfully:', backupId);
      } else {
        console.log('No changes detected, backup on close skipped');
      }
    } catch (error) {
      console.error('Backup on close failed:', error);
    }
  };

  // Synchronous backup for critical exit scenarios (beforeunload/unload)
  const createBackupOnCloseSync = () => {
    try {
      if (!initialDataSnapshot) {
        console.log('No initial snapshot available, skipping sync backup');
        return;
      }

      // Use chrome.storage.local.set synchronously where possible
      const timestamp = new Date().toISOString();
      const backupId = `backup-${Date.now()}`;
      
      // Store a minimal emergency backup immediately
      const emergencyBackup = {
        id: backupId,
        metadata: {
          exportDate: timestamp,
          version: '1.0',
          description: 'Emergency backup on close',
          isAutoBackup: true
        },
        timestamp: Date.now()
      };

      // Use localStorage as fallback for immediate sync storage
      localStorage.setItem('job-assistant-emergency-backup', JSON.stringify(emergencyBackup));
      console.log('Emergency backup stored in localStorage');
      
      // Attempt async backup as well (might complete if there's time)
      setTimeout(() => {
        createBackupOnClose().catch(() => {
          console.log('Async backup failed, emergency backup is available');
        });
      }, 0);

    } catch (error) {
      console.error('Sync backup failed:', error);
    }
  };

  // Check for unsaved changes in drafts or modified data
  const checkForUnsavedChanges = (): boolean => {
    try {
      // Check localStorage for drafts
      const resumeDraft = localStorage.getItem('resume-draft');
      const coverLetterDraft = localStorage.getItem('cover-letter-draft');
      
      // Check for section drafts
      const draftKeys = Object.keys(localStorage).filter(key => key.startsWith('section-draft-'));
      
      if (resumeDraft || coverLetterDraft || draftKeys.length > 0) {
        return true;
      }
      
      // Compare current data with initial snapshot
      if (initialDataSnapshot) {
        const hasDataChanges = checkDataChanges();
        return hasDataChanges;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking for unsaved changes:', error);
      return false;
    }
  };

  // Helper to check if data has changed since initial load
  const checkDataChanges = async (): Promise<boolean> => {
    try {
      if (!initialDataSnapshot) return false;
      
      const appStorage = new ApplicationStorage(dataLanguage);
      const cvStorage = new CVStorage(dataLanguage);
      const sectionStorage = new SectionStorage(dataLanguage);

      const [currentApplications, currentCvVersions, currentSections] = await Promise.all([
        appStorage.getAll(),
        cvStorage.getAll(),
        sectionStorage.getAllSections()
      ]);

      // Simple count comparison for quick check
      return (
        currentApplications.length !== initialDataSnapshot.applications.length ||
        currentCvVersions.length !== initialDataSnapshot.cvVersions.length ||
        currentSections.filter(s => !s.isTemplate).length !== initialDataSnapshot.sections.filter((s: any) => !s.isTemplate).length
      );
    } catch (error) {
      console.error('Error checking data changes:', error);
      return false;
    }
  };

  const loadApplications = async () => {
    try {
      const appStorage = new ApplicationStorage(dataLanguage);
      const cvStorage = new CVStorage(dataLanguage);
      const [apps, versions] = await Promise.all([
        appStorage.getAll(),
        cvStorage.getAll()
      ]);
      setApplications(apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setCvVersions(versions);
      
      console.log('Data reloaded - Apps:', apps.length, 'Versions:', versions.length); // Debug log
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Make loadApplications available globally for data refresh
  useEffect(() => {
    (window as any).refreshApplicationData = loadApplications;
    return () => {
      delete (window as any).refreshApplicationData;
    };
  }, []);

  // Handle hash-based navigation to specific applications
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#app-')) {
        const appId = hash.replace('#app-', '');
        const app = applications.find(a => a.id === appId);
        if (app) {
          setActiveTab('applications');
          setSelectedApp(app);
          // Clear hash after navigation
          window.location.hash = '';
        }
      }
    };

    // Check hash on load and when applications data changes
    if (applications.length > 0) {
      handleHashNavigation();
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashNavigation);
    return () => window.removeEventListener('hashchange', handleHashNavigation);
  }, [applications]);

  const updateStatus = async (id: string, status: JobApplication['status']) => {
    try {
      const storage = new ApplicationStorage(dataLanguage);
      await storage.updateStatus(id, status);
      
      // Update local state immediately for UI responsiveness
      setApplications(prevApps => 
        prevApps.map(app => 
          app.id === id ? { ...app, status } : app
        )
      );
      
      // Update selectedApp if it's the one being updated
      if (selectedApp?.id === id) {
        setSelectedApp({ ...selectedApp, status });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      // If error, reload to get correct state
      await loadApplications();
    }
  };

  const deleteApplication = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    try {
      const storage = new ApplicationStorage(dataLanguage);
      await storage.delete(id);
      await loadApplications();
      if (selectedApp?.id === id) {
        setSelectedApp(null);
      }
    } catch (error) {
      console.error('Failed to delete application:', error);
    }
  };

  const saveField = async (field: string, value: string | string[]) => {
    if (!selectedApp) return;
    
    try {
      const storage = new ApplicationStorage(dataLanguage);
      const updatedApp = { ...selectedApp, [field]: value };
      await storage.save(updatedApp);
      await loadApplications();
      setSelectedApp(updatedApp);
      setEditingField(null);
    } catch (error) {
      console.error('Failed to save field:', error);
    }
  };

  const startEditing = (field: string, currentValue: string | string[]) => {
    setEditingField(field);
    setTempValue(Array.isArray(currentValue) ? currentValue.join('\n') : currentValue || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleSave = () => {
    if (!editingField) return;
    
    const value = editingField === 'requirements' 
      ? tempValue.split('\n').filter(line => line.trim())
      : tempValue;
    
    saveField(editingField, value);
  };

  const exportToCSV = () => {
    try {
      console.log('Starting CSV export...');
      const headers = ['Title', 'Company', 'Location', 'Work Type', 'Salary', 'Requirements', 'Status', 'Date Created', 'Position ID', 'URL'];
      const csvContent = [
        headers.join(','),
        ...applications.map(app => [
          `"${app.title}"`,
          `"${app.company}"`,
          `"${app.location}"`,
          `"${app.workType}"`,
          `"${app.salary || ''}"`,
          `"${(Array.isArray(app.requirements) ? app.requirements.join('; ') : app.requirements || '').replace(/"/g, '""')}"`,
          `"${app.status}"`,
          `"${new Date(app.createdAt).toLocaleDateString()}"`,
          `"${app.positionId || ''}"`,
          `"${app.url}"`
        ].join(','))
      ].join('\n');

      console.log('CSV content created, length:', csvContent.length);

      // Add BOM for proper Unicode encoding in CSV
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('CSV export completed successfully');
    } catch (error) {
      console.error('CSV export failed:', error);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getStatusColor = (status: JobApplication['status']) => {
    const colors = {
      saved: 'bg-gray-100 text-gray-800',
      applied: 'bg-blue-100 text-blue-800',
      interviewing: 'bg-yellow-100 text-yellow-800',
      offered: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Assistant Dashboard</h1>
              <p className="text-gray-600 mt-2">Track applications and manage your resume versions</p>
              {lastBackupTime && (
                <p className="text-xs text-green-600 mt-1">
                  💾 Last backup: {new Date(lastBackupTime).toLocaleString()} • Event-based backup system active
                </p>
              )}
            </div>
            {activeTab === 'applications' && (
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                  id="importFile"
                />
                <label
                  htmlFor="importFile"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm cursor-pointer"
                  title="Import data from backup file"
                >
                  Import Backup
                </label>
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                  title="Help & Tips"
                >
                  Help
                </button>
                <button
                  onClick={() => setShowBackupModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Backup Manager
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-6 border-b border-gray-200">
            <div className="flex items-center justify-between pb-2">
              <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'applications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title="Ctrl/Cmd + 1"
              >
                Job Applications
              </button>
              <button
                onClick={() => setActiveTab('resume')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'resume'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title="Ctrl/Cmd + 2"
              >
                Resume
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'library'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title="Ctrl/Cmd + 3"
              >
                Library
              </button>
              <button
                onClick={() => setActiveTab('cover-letter')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cover-letter'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                title="Ctrl/Cmd + 4"
              >
                Cover Letter
              </button>
              </nav>
              
              <div className="flex items-center gap-3">
                {/* Data Language Switch */}
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500">Data:</div>
                  <button
                    onClick={async () => {
                      const newDataLang = dataLanguage === 'en' ? 'zh' : 'en';
                      setDataLanguage(newDataLang);
                      setLoading(true);
                      setSelectedApp(null); // Clear selection when switching
                      
                      // Reload data for new language
                      try {
                        const appStorage = new ApplicationStorage(newDataLang);
                        const cvStorage = new CVStorage(newDataLang);
                        const [apps, versions] = await Promise.all([
                          appStorage.getAll(),
                          cvStorage.getAll()
                        ]);
                        setApplications(apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                        setCvVersions(versions);
                        console.log(`Switched to ${newDataLang === 'zh' ? 'Chinese' : 'English'} dataset - Apps: ${apps.length}, Versions: ${versions.length}`);
                      } catch (error) {
                        console.error('Failed to switch data language:', error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
                    title={`Switch to ${dataLanguage === 'zh' ? 'English' : 'Chinese'} job data`}
                  >
                    {dataLanguage === 'zh' ? '中文' : 'EN'}
                  </button>
                </div>

                {activeTab === 'applications' && (
                  <button
                    onClick={exportToCSV}
                    disabled={applications.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                  >
                    {t('common.export')} CSV ({applications.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'applications' ? (
          <div className="flex gap-6 transition-all duration-300">
          {/* Applications List */}
          <div className={`bg-white rounded-lg shadow transition-all duration-300 ease-in-out ${selectedApp ? 'w-2/5' : 'flex-1'}`}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Applications ({filteredApplications.length})</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    + Add Job
                  </button>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1"
                  >
                    <option value="all">All</option>
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {filteredApplications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No applications found. Use the extension popup to parse job postings!
                </div>
              ) : (
                filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border border-gray-200 rounded-lg mb-3 transition-all ${
                      selectedApp?.id === app.id ? 'bg-blue-50 border-blue-300 shadow-md' : ''
                    }`}
                    onClick={() => {
                      // Add visual feedback with smooth transition
                      const clickedApp = selectedApp?.id === app.id ? null : app;
                      setSelectedApp(clickedApp);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{app.title}</h3>
                        <p className="text-sm text-gray-600">{app.company}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {app.location} • {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                        
                        {/* Quick info about linked documents */}
                        <div className="flex gap-2 mt-2">
                          {app.resumeVersionId && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              📄 Resume Linked
                            </span>
                          )}
                          {app.coverLetterVersionId && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                              📝 Cover Letter Linked
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                        {selectedApp?.id === app.id && (
                          <div className="text-blue-600 text-xs flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                            Selected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Application Details - Improved with smooth transitions */}
          <div className={`transition-all duration-300 ease-in-out ${selectedApp ? 'w-3/5 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
            {selectedApp && (
              <div className="bg-white rounded-lg shadow h-full">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-semibold">{selectedApp.title}</h2>
                      <button
                        onClick={() => setSelectedApp(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Close details panel"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-gray-600">{selectedApp.company}</p>
                  </div>
                  <button
                    onClick={() => deleteApplication(selectedApp.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Linked Resume Display */}
                {selectedApp.resumeVersionId && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          📄 Resume Attached: {(() => {
                            const resumeDoc = cvVersions.find(v => v.id === selectedApp.resumeVersionId);
                            if (!resumeDoc) return 'Resume';
                            console.log('Resume Doc:', resumeDoc); // Debug log
                            const name = resumeDoc.title || 'Resume';
                            const version = ''; // No longer showing version numbers for standalone documents
                            return `${name} ${version}`.trim();
                          })()}
                        </p>
                        <p className="text-xs text-green-700">
                          {cvVersions.find(v => v.id === selectedApp.resumeVersionId)?.note || 'No notes'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          // Navigate to resume tab and load this specific version
                          setActiveTab('resume');
                          // Pass the version ID to the Resume component via URL hash - use setTimeout to ensure tab switch happens first
                          setTimeout(() => {
                            window.location.hash = `#resume-${selectedApp.resumeVersionId}`;
                          }, 100);
                          
                          // Visual feedback
                          const successEl = document.createElement('div');
                          successEl.textContent = '📄 Opening resume...';
                          successEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                          document.body.appendChild(successEl);
                          setTimeout(() => document.body.removeChild(successEl), 2000);
                        }}
                        className="px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                        title="Open this resume version in Resume tab"
                      >
                        📄 Open Resume
                      </button>
                    </div>
                  </div>
                )}

                {/* Cover Letter Display */}
                {selectedApp.coverLetterVersionId && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-900">
                          📝 Cover Letter Attached: {(() => {
                            const coverDoc = cvVersions.find(v => v.id === selectedApp.coverLetterVersionId);
                            if (!coverDoc) return 'Cover Letter';
                            console.log('Cover Letter Doc:', coverDoc); // Debug log
                            const name = coverDoc.title || 'Cover Letter';
                            const version = ''; // No longer showing version numbers for standalone documents
                            return `${name} ${version}`.trim();
                          })()}
                        </p>
                        <p className="text-xs text-purple-700">
                          {cvVersions.find(v => v.id === selectedApp.coverLetterVersionId)?.note || 'No notes'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          // Navigate to cover letter tab and load this specific version
                          setActiveTab('cover-letter');
                          // Pass the version ID to the Cover Letter component via URL hash - use setTimeout to ensure tab switch happens first
                          setTimeout(() => {
                            window.location.hash = `#cover-letter-${selectedApp.coverLetterVersionId}`;
                          }, 100);
                          
                          // Visual feedback
                          const successEl = document.createElement('div');
                          successEl.textContent = '📝 Opening cover letter...';
                          successEl.className = 'fixed top-4 right-4 bg-purple-500 text-white px-4 py-2 rounded shadow-lg z-50';
                          document.body.appendChild(successEl);
                          setTimeout(() => document.body.removeChild(successEl), 2000);
                        }}
                        className="px-3 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                        title="Open this cover letter version in Cover Letter tab"
                      >
                        📝 Open Cover Letter
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedApp.status}
                    onChange={(e) => updateStatus(selectedApp.id, e.target.value as JobApplication['status'])}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Job URL</label>
                    <button
                      onClick={() => copyToClipboard(selectedApp.url)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 break-all">{selectedApp.url}</p>
                </div>

                <EditableField
                  label="Location"
                  field="location"
                  value={selectedApp.location}
                  editingField={editingField}
                  tempValue={tempValue}
                  onStartEdit={startEditing}
                  onSave={handleSave}
                  onCancel={cancelEditing}
                  onTempValueChange={setTempValue}
                />

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Work Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(selectedApp.workType)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                      {editingField !== 'workType' ? (
                        <button
                          onClick={() => startEditing('workType', selectedApp.workType)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {editingField === 'workType' ? (
                    <select
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-600 mt-1 capitalize">
                      {selectedApp.workType}
                    </p>
                  )}
                </div>

                {selectedApp.salary && (
                  <EditableField
                    label="Salary"
                    field="salary"
                    value={selectedApp.salary}
                    editingField={editingField}
                    tempValue={tempValue}
                    onStartEdit={startEditing}
                    onSave={handleSave}
                    onCancel={cancelEditing}
                    onTempValueChange={setTempValue}
                  />
                )}

                {selectedApp.positionId && (
                  <EditableField
                    label="Position ID"
                    field="positionId"
                    value={selectedApp.positionId}
                    editingField={editingField}
                    tempValue={tempValue}
                    onStartEdit={startEditing}
                    onSave={handleSave}
                    onCancel={cancelEditing}
                    onTempValueChange={setTempValue}
                  />
                )}

                <EditableField
                  label="Requirements"
                  field="requirements"
                  value={selectedApp.requirements}
                  editingField={editingField}
                  tempValue={tempValue}
                  onStartEdit={startEditing}
                  onSave={handleSave}
                  onCancel={cancelEditing}
                  onTempValueChange={setTempValue}
                  multiline={true}
                />

                <EditableField
                  label="Description"
                  field="description"
                  value={selectedApp.description}
                  editingField={editingField}
                  tempValue={tempValue}
                  onStartEdit={startEditing}
                  onSave={handleSave}
                  onCancel={cancelEditing}
                  onTempValueChange={setTempValue}
                  multiline={true}
                />

                <EditableField
                  label="Notes"
                  field="notes"
                  value={selectedApp.notes}
                  editingField={editingField}
                  tempValue={tempValue}
                  onStartEdit={startEditing}
                  onSave={handleSave}
                  onCancel={cancelEditing}
                  onTempValueChange={setTempValue}
                  multiline={true}
                />

                {/* Resume/Cover Letter selection removed - linking done from Resume/Cover Letter pages */}
              </div>
            </div>
          )}
            </div>
          </div>
        ) : activeTab === 'resume' ? (
          <SimpleCV dataLanguage={dataLanguage} />
        ) : activeTab === 'library' ? (
          <SectionLibrary dataLanguage={dataLanguage} />
        ) : (
          <CoverLetter dataLanguage={dataLanguage} />
        )}
      </div>

      {/* Add Job Modal */}
      {showAddModal && <AddJobModal onClose={() => setShowAddModal(false)} onSave={loadApplications} cvVersions={cvVersions} dataLanguage={dataLanguage} />}
      
      {/* Backup Manager Modal */}
      {showBackupModal && (
        <BackupManagerModal 
          onClose={() => setShowBackupModal(false)} 
          backupStorage={backupStorage}
          onRestore={loadApplications}
          dataLanguage={dataLanguage}
        />
      )}
      
      {/* Help Tips Modal */}
      {showHelpModal && (
        <HelpTips
          show={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
      )}
    </div>
  );
}

interface BackupManagerModalProps {
  onClose: () => void;
  backupStorage: BackupStorage;
  onRestore: () => void;
  dataLanguage: 'zh' | 'en';
}

function BackupManagerModal({ onClose, backupStorage, onRestore, dataLanguage }: BackupManagerModalProps) {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomBackup, setShowCustomBackup] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backupNote, setBackupNote] = useState('');

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const backupList = await backupStorage.getAllBackups();
      setBackups(backupList);
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createManualBackup = async () => {
    try {
      // Create full language backup (includes both Chinese and English data)
      await backupStorage.createFullLanguageBackup('Manual backup', false);

      await loadBackups();
      alert('Manual backup created successfully!\n\n✅ Both Chinese and English datasets have been backed up.');
    } catch (error) {
      console.error('Failed to create backup:', error);
      alert('Failed to create backup');
    }
  };

  const createCustomBackup = async () => {
    if (!backupName.trim()) return;
    
    try {
      // Create full language backup with custom name
      await backupStorage.createFullLanguageBackup(backupName.trim(), false);

      await loadBackups();
      setShowCustomBackup(false);
      setBackupName('');
      setBackupNote('');
      alert('Custom backup created successfully!\n\n✅ Both Chinese and English datasets have been backed up.');
    } catch (error) {
      console.error('Failed to create custom backup:', error);
      alert('Failed to create custom backup');
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Backup Manager</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomBackup(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                title="Create custom backup with both Chinese and English data"
              >
                📝 Custom Backup
              </button>
              <button
                onClick={createManualBackup}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                title="Quick backup of all data (Chinese + English)"
              >
                🌍 Full Backup
              </button>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {showCustomBackup && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Create Custom Full Backup</h3>
              <p className="text-sm text-gray-600 mb-3">📄 Will backup both Chinese and English datasets</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Backup Name *
                  </label>
                  <input
                    type="text"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Before Job Fair Applications"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={backupNote}
                    onChange={(e) => setBackupNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Additional notes about this backup..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={createCustomBackup}
                    disabled={!backupName.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Create Backup
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomBackup(false);
                      setBackupName('');
                      setBackupNote('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {loading ? (
            <div className="animate-pulse">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No backups found</p>
              <button onClick={createManualBackup} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
                Create First Backup
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map(backup => (
                <div key={backup.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">
                        {backup.metadata.description}
                        {backup.zh && backup.en && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            🌍 Full Backup
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{new Date(backup.metadata.exportDate).toLocaleString()}</p>
                      {backup.zh && backup.en ? (
                        <p className="text-xs text-gray-500">
                          Chinese: {backup.zh.applications.length} apps, {backup.zh.cvVersions.length} versions | 
                          English: {backup.en.applications.length} apps, {backup.en.cvVersions.length} versions
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">{backup.applications?.length || 0} apps, {backup.cvVersions?.length || 0} versions (Legacy)</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {backup.zh && backup.en ? (
                        // New format - show restore options for both languages
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={async () => {
                              if (confirm(`Restore Chinese data from "${backup.metadata.description}"?\n\nThis will replace your current Chinese dataset.`)) {
                                try {
                                  await backupStorage.restoreBackupToLanguage(backup.id, 'zh');
                                  onRestore();
                                  onClose();
                                  alert('Chinese data restored successfully!');
                                } catch (error) {
                                  alert('Restore failed');
                                }
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                          >
                            Restore 中文
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Restore English data from "${backup.metadata.description}"?\n\nThis will replace your current English dataset.`)) {
                                try {
                                  await backupStorage.restoreBackupToLanguage(backup.id, 'en');
                                  onRestore();
                                  onClose();
                                  alert('English data restored successfully!');
                                } catch (error) {
                                  alert('Restore failed');
                                }
                              }
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                          >
                            Restore EN
                          </button>
                        </div>
                      ) : (
                        // Legacy format - restore to current language
                        <button
                          onClick={async () => {
                            if (confirm(`Restore legacy backup "${backup.metadata.description}"?\n\nThis will replace your current ${dataLanguage === 'zh' ? 'Chinese' : 'English'} dataset.`)) {
                              try {
                                await backupStorage.restoreBackupToLanguage(backup.id, dataLanguage);
                                onRestore();
                                onClose();
                                alert('Data restored successfully!');
                              } catch (error) {
                                alert('Restore failed');
                              }
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                        >
                          Restore
                        </button>
                      )}
                      <button
                        onClick={() => backupStorage.exportBackupAsFile(backup.id)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                      >
                        Export
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete backup "${backup.metadata.description}"?`)) {
                            try {
                              await backupStorage.deleteBackup(backup.id);
                              await loadBackups();
                            } catch (error) {
                              alert('Failed to delete backup');
                            }
                          }
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EditableFieldProps {
  label: string;
  field: string;
  value: string | string[];
  editingField: string | null;
  tempValue: string;
  onStartEdit: (field: string, value: string | string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  onTempValueChange: (value: string) => void;
  multiline?: boolean;
  copyable?: boolean;
}

function EditableField({ 
  label, 
  field, 
  value, 
  editingField, 
  tempValue, 
  onStartEdit, 
  onSave, 
  onCancel, 
  onTempValueChange,
  multiline = false,
  copyable = true
}: EditableFieldProps) {
  const isEditing = editingField === field;
  const displayValue = Array.isArray(value) ? value.join(', ') : (value || '');
  const copyValue = Array.isArray(value) ? value.join('\n') : (value || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(copyValue);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-2">
          {copyable && !isEditing && (
            <button
              onClick={handleCopy}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Copy
            </button>
          )}
          {!isEditing ? (
            <button
              onClick={() => onStartEdit(field, value)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onSave}
                className="text-xs text-green-600 hover:text-green-800"
              >
                Save
              </button>
              <button
                onClick={onCancel}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      {isEditing ? (
        multiline ? (
          <textarea
            value={tempValue}
            onChange={(e) => onTempValueChange(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm"
            rows={4}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        ) : (
          <input
            type="text"
            value={tempValue}
            onChange={(e) => onTempValueChange(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        )
      ) : (
        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
          {displayValue || `No ${label.toLowerCase()} added yet.`}
        </p>
      )}
    </div>
  );
}

interface ResumeVersionSelectProps {
  versions: CVVersion[];
  selectedVersionId?: string;
  onSelect: (versionId: string) => void;
}

function ResumeVersionSelect({ versions, selectedVersionId, onSelect }: ResumeVersionSelectProps) {
  // Filter only resume versions (not cover letters)
  const resumeVersions = versions.filter(v => v.type !== 'cover-letter');
  
  return (
    <select
      value={selectedVersionId || ''}
      onChange={(e) => {
        console.log('Selected version:', e.target.value);
        onSelect(e.target.value);
      }}
      className="w-full px-3 py-2 border border-gray-300 rounded"
    >
      <option value="">No resume selected</option>
      {resumeVersions.map(version => (
        <option key={version.id} value={version.id}>
          {version.title || 'Resume'} - {version.note || 'No notes'}
        </option>
      ))}
    </select>
  );
}

interface CoverLetterVersionSelectProps {
  versions: CVVersion[];
  selectedVersionId?: string;
  onSelect: (versionId: string) => void;
}

function CoverLetterVersionSelect({ versions, selectedVersionId, onSelect }: CoverLetterVersionSelectProps) {
  // Filter only cover letter versions
  const coverLetterVersions = versions.filter(v => v.type === 'cover-letter');
  
  return (
    <select
      value={selectedVersionId || ''}
      onChange={(e) => {
        console.log('Selected cover letter version:', e.target.value);
        onSelect(e.target.value);
      }}
      className="w-full px-3 py-2 border border-gray-300 rounded"
    >
      <option value="">No cover letter selected</option>
      {coverLetterVersions.map(version => (
        <option key={version.id} value={version.id}>
          {version.title || 'Cover Letter'} - {version.note || 'No notes'}
        </option>
      ))}
    </select>
  );
}

interface ResumeSectionProps {
  application: JobApplication;
  cvVersions: CVVersion[];
  onUpdate: () => void;
  onApplicationUpdate: (updatedApp: JobApplication) => void;
  dataLanguage: 'zh' | 'en';
}

function ResumeSection({ application, cvVersions, onUpdate, onApplicationUpdate, dataLanguage }: ResumeSectionProps) {
  const linkedResumeVersion = cvVersions.find(v => v.id === application.resumeVersionId && v.type !== 'cover-letter');
  const linkedCoverLetterVersion = cvVersions.find(v => v.id === application.coverLetterVersionId && v.type === 'cover-letter');
  
  const linkResumeToApplication = async (versionId: string) => {
    try {
      const appStorage = new ApplicationStorage(dataLanguage);
      const cvStorage = new CVStorage(dataLanguage);
      
      const updatedApp = { ...application, resumeVersionId: versionId || undefined };
      await appStorage.save(updatedApp);
      
      if (versionId) {
        await cvStorage.linkToApplication(versionId, application.id);
      }
      
      // Unlink from previous version if changed
      if (application.resumeVersionId && application.resumeVersionId !== versionId) {
        await cvStorage.unlinkFromApplication(application.resumeVersionId, application.id);
      }
      
      onUpdate();
      onApplicationUpdate(updatedApp);
    } catch (error) {
      console.error('Failed to link resume:', error);
    }
  };
  
  const copyResumeToClipboard = async () => {
    if (!linkedResumeVersion) return;
    try {
      await navigator.clipboard.writeText(linkedResumeVersion.content);
      alert('Resume LaTeX copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy resume:', error);
    }
  };
  
  const linkCoverLetterToApplication = async (versionId: string) => {
    try {
      const appStorage = new ApplicationStorage(dataLanguage);
      const cvStorage = new CVStorage(dataLanguage);
      
      const updatedApp = { ...application, coverLetterVersionId: versionId || undefined };
      await appStorage.save(updatedApp);
      
      if (versionId) {
        await cvStorage.linkToApplication(versionId, application.id);
      }
      
      // Unlink from previous version if changed
      if (application.coverLetterVersionId && application.coverLetterVersionId !== versionId) {
        await cvStorage.unlinkFromApplication(application.coverLetterVersionId, application.id);
      }
      
      onUpdate();
      onApplicationUpdate(updatedApp);
    } catch (error) {
      console.error('Failed to link cover letter:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resume Section */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Resume Version</label>
          {linkedResumeVersion && (
            <button
              onClick={copyResumeToClipboard}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Copy LaTeX
            </button>
          )}
        </div>
        {linkedResumeVersion ? (
          <div className="mt-1">
            <p className="text-sm font-medium text-gray-800 mb-1">
              {linkedResumeVersion.title || 'Resume'}
            </p>
            <p className="text-xs text-gray-600 mb-2">
              {linkedResumeVersion.note || 'No notes'}
            </p>
            <p className="text-xs text-gray-500">
              Created: {new Date(linkedResumeVersion.created).toLocaleDateString()}
            </p>
            <div className="mt-2">
              <ResumeVersionSelect
                versions={cvVersions}
                selectedVersionId={application.resumeVersionId}
                onSelect={linkResumeToApplication}
              />
            </div>
          </div>
        ) : (
          <div className="mt-1">
            <ResumeVersionSelect
              versions={cvVersions}
              selectedVersionId={application.resumeVersionId}
              onSelect={linkResumeToApplication}
            />
          </div>
        )}
      </div>
      
      {/* Cover Letter Section */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Cover Letter Version</label>
        </div>
        {linkedCoverLetterVersion ? (
          <div className="mt-1">
            <p className="text-sm font-medium text-gray-800 mb-1">
              {linkedCoverLetterVersion.title || 'Cover Letter'}
            </p>
            <p className="text-xs text-gray-600 mb-2">
              {linkedCoverLetterVersion.note || 'No notes'}
            </p>
            <p className="text-xs text-gray-500">
              Created: {new Date(linkedCoverLetterVersion.created).toLocaleDateString()}
            </p>
            <div className="mt-2">
              <CoverLetterVersionSelect
                versions={cvVersions}
                selectedVersionId={application.coverLetterVersionId}
                onSelect={linkCoverLetterToApplication}
              />
            </div>
          </div>
        ) : (
          <div className="mt-1">
            <CoverLetterVersionSelect
              versions={cvVersions}
              selectedVersionId={application.coverLetterVersionId}
              onSelect={linkCoverLetterToApplication}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AddJobModal({ onClose, onSave, cvVersions, dataLanguage }: { onClose: () => void; onSave: () => void; cvVersions: CVVersion[]; dataLanguage: 'zh' | 'en' }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    url: '',
    location: '',
    workType: 'unknown' as const,
    description: '',
    requirements: '',
    salary: '',
    positionId: '',
    notes: '',
    resumeVersionId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.company) {
      alert('Title and Company are required');
      return;
    }

    try {
      const storage = new ApplicationStorage(dataLanguage);
      const application: JobApplication = {
        id: crypto.randomUUID(),
        title: formData.title,
        company: formData.company,
        url: formData.url,
        description: formData.description,
        requirements: formData.requirements.split('\n').filter(r => r.trim()),
        salary: formData.salary,
        location: formData.location,
        workType: formData.workType,
        positionId: formData.positionId || undefined,
        status: 'saved',
        notes: formData.notes,
        resumeVersionId: formData.resumeVersionId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await storage.save(application);
      
      // Link to resume version if selected
      if (formData.resumeVersionId) {
        const cvStorage = new CVStorage(dataLanguage);
        await cvStorage.linkToApplication(formData.resumeVersionId, application.id);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save application:', error);
      alert('Failed to save application');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Job Application</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
              <select
                value={formData.workType}
                onChange={(e) => setFormData(prev => ({ ...prev, workType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="unknown">Unknown</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
              <input
                type="text"
                value={formData.salary}
                onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="e.g., $80,000 - $120,000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position ID</label>
              <input
                type="text"
                value={formData.positionId}
                onChange={(e) => setFormData(prev => ({ ...prev, positionId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="e.g., JOB-12345"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (one per line)</label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resume Version (Optional)</label>
            <ResumeVersionSelect
              versions={cvVersions}
              selectedVersionId={formData.resumeVersionId}
              onSelect={(versionId) => setFormData(prev => ({ ...prev, resumeVersionId: versionId }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}