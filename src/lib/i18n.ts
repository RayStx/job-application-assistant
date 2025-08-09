import { useReducer, useEffect } from 'react';

export interface TranslationKeys {
  // Common
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.close': string;
  'common.loading': string;
  'common.search': string;
  'common.back': string;
  'common.next': string;
  'common.previous': string;
  'common.confirm': string;
  'common.yes': string;
  'common.no': string;
  'common.export': string;
  
  // Navigation
  'nav.applications': string;
  'nav.resume': string;
  'nav.coverLetter': string;
  'nav.library': string;
  'nav.help': string;
  'nav.backup': string;
  
  // Applications
  'app.title': string;
  'app.company': string;
  'app.status': string;
  'app.dateApplied': string;
  'app.addNew': string;
  'app.details': string;
  'app.notes': string;
  'app.jobUrl': string;
  'app.salary': string;
  'app.location': string;
  'app.contactPerson': string;
  'app.followUpDate': string;
  
  // Resume/CV
  'resume.title': string;
  'resume.version': string;
  'resume.versionHistory': string;
  'resume.duplicateAndSave': string;
  'resume.linkedApplications': string;
  'resume.usedInApplications': string;
  'resume.autoSaves': string;
  'resume.noVersions': string;
  
  // Cover Letter
  'coverLetter.title': string;
  'coverLetter.template': string;
  'coverLetter.customize': string;
  
  // Section Library
  'library.title': string;
  'library.education': string;
  'library.experience': string;
  'library.research': string;
  'library.skills': string;
  'library.achievements': string;
  'library.custom': string;
  'library.templates': string;
  'library.createFromTemplate': string;
  'library.noSections': string;
  
  // Backup
  'backup.title': string;
  'backup.create': string;
  'backup.export': string;
  'backup.import': string;
  'backup.automatic': string;
  'backup.manual': string;
  'backup.unsavedChanges': string;
  'backup.confirmBackup': string;
  
  // Help
  'help.title': string;
  'help.keyboard': string;
  'help.features': string;
  'help.tips': string;
  'help.shortcuts': string;
  
  // Status
  'status.applied': string;
  'status.pending': string;
  'status.interview': string;
  'status.offered': string;
  'status.rejected': string;
  'status.withdrawn': string;
  
  // Messages
  'message.saveSuccess': string;
  'message.deleteConfirm': string;
  'message.exportSuccess': string;
  'message.importSuccess': string;
  'message.copySuccess': string;
  'message.linkSuccess': string;
  'message.errorOccurred': string;
  'message.noChanges': string;
}

export const translations: Record<'en' | 'zh', TranslationKeys> = {
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.search': 'Search',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.export': 'Export',
    
    // Navigation
    'nav.applications': 'Job Applications',
    'nav.resume': 'Resume',
    'nav.coverLetter': 'Cover Letter',
    'nav.library': 'Section Library',
    'nav.help': 'Help',
    'nav.backup': 'Backup',
    
    // Applications
    'app.title': 'Job Title',
    'app.company': 'Company',
    'app.status': 'Status',
    'app.dateApplied': 'Date Applied',
    'app.addNew': 'Add Application',
    'app.details': 'Details',
    'app.notes': 'Notes',
    'app.jobUrl': 'Job URL',
    'app.salary': 'Salary',
    'app.location': 'Location',
    'app.contactPerson': 'Contact Person',
    'app.followUpDate': 'Follow-up Date',
    
    // Resume/CV
    'resume.title': 'Resume',
    'resume.version': 'Version',
    'resume.versionHistory': 'Version History',
    'resume.duplicateAndSave': 'Duplicate & Save',
    'resume.linkedApplications': 'Linked Applications',
    'resume.usedInApplications': 'Used in {count} application{s}',
    'resume.autoSaves': 'Auto-saves with version control',
    'resume.noVersions': 'No versions yet',
    
    // Cover Letter
    'coverLetter.title': 'Cover Letter',
    'coverLetter.template': 'Template',
    'coverLetter.customize': 'Customize',
    
    // Section Library
    'library.title': 'Section Library',
    'library.education': 'Education',
    'library.experience': 'Experience',
    'library.research': 'Research',
    'library.skills': 'Skills',
    'library.achievements': 'Achievements',
    'library.custom': 'Custom',
    'library.templates': 'Templates',
    'library.createFromTemplate': 'Create from template',
    'library.noSections': 'No sections yet',
    
    // Backup
    'backup.title': 'Backup Manager',
    'backup.create': 'Create Backup',
    'backup.export': 'Export',
    'backup.import': 'Import',
    'backup.automatic': 'Automatic',
    'backup.manual': 'Manual',
    'backup.unsavedChanges': 'You have unsaved changes. Would you like to create a backup before leaving?',
    'backup.confirmBackup': 'Create a backup before closing?',
    
    // Help
    'help.title': 'Help & Tips',
    'help.keyboard': 'Keyboard Shortcuts',
    'help.features': 'Features Guide',
    'help.tips': 'Tips & Tricks',
    'help.shortcuts': 'Shortcuts',
    
    // Status
    'status.applied': 'Applied',
    'status.pending': 'Pending',
    'status.interview': 'Interview',
    'status.offered': 'Offered',
    'status.rejected': 'Rejected',
    'status.withdrawn': 'Withdrawn',
    
    // Messages
    'message.saveSuccess': 'Changes saved successfully',
    'message.deleteConfirm': 'Are you sure you want to delete this item?',
    'message.exportSuccess': 'Export completed successfully',
    'message.importSuccess': 'Import completed successfully',
    'message.copySuccess': 'Copied to clipboard',
    'message.linkSuccess': 'Successfully linked to application',
    'message.errorOccurred': 'An error occurred',
    'message.noChanges': 'No changes detected',
  },
  
  zh: {
    // Common
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.close': '关闭',
    'common.loading': '加载中...',
    'common.search': '搜索',
    'common.back': '返回',
    'common.next': '下一步',
    'common.previous': '上一步',
    'common.confirm': '确认',
    'common.yes': '是',
    'common.no': '否',
    'common.export': '导出',
    
    // Navigation
    'nav.applications': '工作申请',
    'nav.resume': '简历',
    'nav.coverLetter': '求职信',
    'nav.library': '内容库',
    'nav.help': '帮助',
    'nav.backup': '备份',
    
    // Applications
    'app.title': '职位名称',
    'app.company': '公司',
    'app.status': '状态',
    'app.dateApplied': '申请日期',
    'app.addNew': '添加申请',
    'app.details': '详情',
    'app.notes': '备注',
    'app.jobUrl': '职位链接',
    'app.salary': '薪资',
    'app.location': '地点',
    'app.contactPerson': '联系人',
    'app.followUpDate': '跟进日期',
    
    // Resume/CV
    'resume.title': '简历',
    'resume.version': '版本',
    'resume.versionHistory': '版本历史',
    'resume.duplicateAndSave': '复制并保存',
    'resume.linkedApplications': '关联申请',
    'resume.usedInApplications': '已用于 {count} 个申请',
    'resume.autoSaves': '自动保存和版本控制',
    'resume.noVersions': '暂无版本',
    
    // Cover Letter
    'coverLetter.title': '求职信',
    'coverLetter.template': '模板',
    'coverLetter.customize': '自定义',
    
    // Section Library
    'library.title': '内容库',
    'library.education': '教育背景',
    'library.experience': '工作经历',
    'library.research': '研究经历',
    'library.skills': '技能',
    'library.achievements': '成就奖项',
    'library.custom': '自定义',
    'library.templates': '模板',
    'library.createFromTemplate': '从模板创建',
    'library.noSections': '暂无内容',
    
    // Backup
    'backup.title': '备份管理',
    'backup.create': '创建备份',
    'backup.export': '导出',
    'backup.import': '导入',
    'backup.automatic': '自动',
    'backup.manual': '手动',
    'backup.unsavedChanges': '您有未保存的更改。是否在离开前创建备份？',
    'backup.confirmBackup': '关闭前创建备份？',
    
    // Help
    'help.title': '帮助与提示',
    'help.keyboard': '键盘快捷键',
    'help.features': '功能指南',
    'help.tips': '使用技巧',
    'help.shortcuts': '快捷键',
    
    // Status
    'status.applied': '已申请',
    'status.pending': '待处理',
    'status.interview': '面试',
    'status.offered': '已录取',
    'status.rejected': '已拒绝',
    'status.withdrawn': '已撤回',
    
    // Messages
    'message.saveSuccess': '保存成功',
    'message.deleteConfirm': '确定要删除此项目吗？',
    'message.exportSuccess': '导出成功',
    'message.importSuccess': '导入成功',
    'message.copySuccess': '已复制到剪贴板',
    'message.linkSuccess': '成功关联到申请',
    'message.errorOccurred': '发生错误',
    'message.noChanges': '未检测到更改',
  }
};

// Language storage key
const LANGUAGE_STORAGE_KEY = 'job-assistant-language';

// Current language state
let currentLanguage: 'en' | 'zh' = 'en';

// Initialize language from storage
export const initializeLanguage = async (): Promise<'en' | 'zh'> => {
  try {
    const result = await chrome.storage.local.get(LANGUAGE_STORAGE_KEY);
    const savedLang = result[LANGUAGE_STORAGE_KEY];
    if (savedLang === 'en' || savedLang === 'zh') {
      currentLanguage = savedLang;
    } else {
      // Auto-detect based on browser language
      const browserLang = navigator.language.toLowerCase();
      currentLanguage = browserLang.startsWith('zh') ? 'zh' : 'en';
    }
    return currentLanguage;
  } catch (error) {
    console.error('Error initializing language:', error);
    return 'en';
  }
};

// Save language preference
export const setLanguage = async (lang: 'en' | 'zh'): Promise<void> => {
  try {
    currentLanguage = lang;
    await chrome.storage.local.set({ [LANGUAGE_STORAGE_KEY]: lang });
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): 'en' | 'zh' => {
  return currentLanguage;
};

// Translation function
export const t = (key: keyof TranslationKeys, params?: Record<string, string | number>): string => {
  try {
    let translation = translations[currentLanguage][key] || translations.en[key] || key;
    
    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    
    return translation;
  } catch (error) {
    console.error('Translation error for key:', key, error);
    return key;
  }
};

// React hook for translations with language change detection

export const useTranslation = () => {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  
  useEffect(() => {
    // Listen for language changes
    const handleLanguageChange = () => forceUpdate();
    
    // Set up listener for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[LANGUAGE_STORAGE_KEY]) {
        const newLang = changes[LANGUAGE_STORAGE_KEY].newValue;
        if (newLang === 'en' || newLang === 'zh') {
          currentLanguage = newLang;
          handleLanguageChange();
        }
      }
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);
  
  return {
    t,
    currentLanguage: getCurrentLanguage(),
    setLanguage,
    initializeLanguage
  };
};