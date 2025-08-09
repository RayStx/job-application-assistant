import type { ResumeSection, CVComposition } from '@/types';

export class SectionStorage {
  private baseSectionKey = 'job-assistant-resume-sections';
  private baseCompositionKey = 'job-assistant-cv-compositions';
  private language: 'zh' | 'en' = 'zh'; // Default to Chinese
  
  constructor(language: 'zh' | 'en' = 'zh') {
    this.language = language;
    // Migrate existing data on first initialization
    this.migrateExistingData();
  }
  
  private get sectionKey() {
    return `${this.baseSectionKey}-${this.language}`;
  }
  
  private get compositionKey() {
    return `${this.baseCompositionKey}-${this.language}`;
  }
  
  // Migrate existing data from old unified storage to language-specific storage
  private async migrateExistingData() {
    try {
      const oldSectionKey = 'job-assistant-resume-sections';
      const oldCompositionKey = 'job-assistant-cv-compositions';
      
      const result = await chrome.storage.local.get([oldSectionKey, oldCompositionKey]);
      const oldSections = result[oldSectionKey];
      const oldCompositions = result[oldCompositionKey];
      
      if ((oldSections && Array.isArray(oldSections) && oldSections.length > 0) || 
          (oldCompositions && Array.isArray(oldCompositions) && oldCompositions.length > 0)) {
        
        // Check if migration already happened
        const newSectionKeyZh = `${this.baseSectionKey}-zh`;
        const newCompositionKeyZh = `${this.baseCompositionKey}-zh`;
        const existingZh = await chrome.storage.local.get([newSectionKeyZh, newCompositionKeyZh]);
        
        if (!existingZh[newSectionKeyZh] && !existingZh[newCompositionKeyZh]) {
          // Migrate to Chinese data set (default for existing users)
          console.log('Migrating existing section data to Chinese dataset...');
          
          const migrationData: any = {};
          if (oldSections) {
            migrationData[newSectionKeyZh] = oldSections;
          }
          if (oldCompositions) {
            migrationData[newCompositionKeyZh] = oldCompositions;
          }
          
          await chrome.storage.local.set(migrationData);
          
          // Remove old data after successful migration
          await chrome.storage.local.remove([oldSectionKey, oldCompositionKey]);
          console.log('Section data migration completed successfully');
        }
      }
    } catch (error) {
      console.error('Failed to migrate existing section data:', error);
    }
  }

  // Section management
  async getAllSections(): Promise<ResumeSection[]> {
    try {
      const result = await chrome.storage.local.get(this.sectionKey);
      return result[this.sectionKey] || [];
    } catch (error) {
      console.error('Failed to load sections:', error);
      return [];
    }
  }

  async getSectionById(id: string): Promise<ResumeSection | null> {
    const sections = await this.getAllSections();
    return sections.find(s => s.id === id) || null;
  }

  async saveSection(section: ResumeSection): Promise<void> {
    try {
      const sections = await this.getAllSections();
      const existingIndex = sections.findIndex(s => s.id === section.id);
      
      if (existingIndex >= 0) {
        sections[existingIndex] = section;
      } else {
        sections.push(section);
      }
      
      await chrome.storage.local.set({ [this.sectionKey]: sections });
    } catch (error) {
      console.error('Failed to save section:', error);
      throw error;
    }
  }

  async deleteSection(id: string): Promise<void> {
    try {
      const sections = await this.getAllSections();
      const filtered = sections.filter(s => s.id !== id);
      await chrome.storage.local.set({ [this.sectionKey]: filtered });
    } catch (error) {
      console.error('Failed to delete section:', error);
      throw error;
    }
  }

  async getSectionsByType(type: ResumeSection['type']): Promise<ResumeSection[]> {
    const sections = await this.getAllSections();
    return sections.filter(s => s.type === type);
  }

  async getTemplates(): Promise<ResumeSection[]> {
    const sections = await this.getAllSections();
    return sections.filter(s => s.isTemplate);
  }

  async createSectionFromTemplate(templateId: string, customizations: Partial<ResumeSection>): Promise<ResumeSection> {
    const template = await this.getSectionById(templateId);
    if (!template) throw new Error('Template not found');

    const newSection: ResumeSection = {
      id: crypto.randomUUID(),
      type: template.type,
      title: customizations.title || `${template.title} (Copy)`,
      content: customizations.content || template.content,
      latexContent: customizations.latexContent || template.latexContent,
      tags: customizations.tags || [...template.tags],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      versionNumber: 1,
      parentId: templateId,
      isTemplate: false
    };

    await this.saveSection(newSection);
    return newSection;
  }

  async getNextVersionNumber(): Promise<number> {
    const sections = await this.getAllSections();
    if (sections.length === 0) return 1;
    return Math.max(...sections.map(s => s.versionNumber)) + 1;
  }

  // CV Composition management
  async getAllCompositions(): Promise<CVComposition[]> {
    try {
      const result = await chrome.storage.local.get(this.compositionKey);
      return result[this.compositionKey] || [];
    } catch (error) {
      console.error('Failed to load compositions:', error);
      return [];
    }
  }

  async saveComposition(composition: CVComposition): Promise<void> {
    try {
      const compositions = await this.getAllCompositions();
      const existingIndex = compositions.findIndex(c => c.id === composition.id);
      
      if (existingIndex >= 0) {
        compositions[existingIndex] = composition;
      } else {
        compositions.push(composition);
      }
      
      await chrome.storage.local.set({ [this.compositionKey]: compositions });
    } catch (error) {
      console.error('Failed to save composition:', error);
      throw error;
    }
  }

  async generateLatexFromComposition(compositionId: string): Promise<string> {
    const composition = await this.getCompositionById(compositionId);
    if (!composition) throw new Error('Composition not found');

    const sections = await Promise.all(
      composition.sectionIds.map(id => this.getSectionById(id))
    );

    const validSections = sections.filter((s): s is ResumeSection => s !== null);
    
    // Sort sections by the order specified in composition
    const orderedSections = composition.sectionOrder.map(order => {
      const index = composition.sectionIds.findIndex((_, i) => i === order);
      return validSections[index];
    }).filter(Boolean);

    return orderedSections.map(section => section.latexContent).join('\n\n');
  }

  async getCompositionById(id: string): Promise<CVComposition | null> {
    const compositions = await this.getAllCompositions();
    return compositions.find(c => c.id === id) || null;
  }

  // Initialize with default templates
  async initializeDefaultTemplates(): Promise<void> {
    const templates = await this.getTemplates();
    if (templates.length > 0) return; // Templates already exist

    const defaultTemplates: ResumeSection[] = [
      {
        id: crypto.randomUUID(),
        type: 'education',
        title: '教育背景模板',
        content: '**大学名称**, 专业名称，*学位类型*\n起始时间 - 结束时间\n\n获得的奖学金或荣誉',
        latexContent: '\\datedsubsection{\\textbf{大学名称}, 专业名称，\\textit{学位类型}}{起始时间 - 结束时间}\n\n获得的奖学金或荣誉',
        tags: ['education', 'template'],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        versionNumber: 1,
        isTemplate: true
      },
      {
        id: crypto.randomUUID(),
        type: 'experience',
        title: '实习经历模板',
        content: '**公司名称** | 部门/团队, **职位**, 城市\n起始时间-结束时间\n\n• 主要成就描述：包括具体数据和影响\n• 另一项重要工作内容和结果\n• 技术优化或创新方面的贡献',
        latexContent: '\\datedsubsection{\\textbf{公司名称} | 部门/团队, \\textbf{职位}, 城市}{起始时间-结束时间}\n\\begin{itemize}\n  \\item 主要成就描述：包括具体数据和影响\n  \\item 另一项重要工作内容和结果\n  \\item 技术优化或创新方面的贡献\n\\end{itemize}',
        tags: ['experience', 'internship', 'template'],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        versionNumber: 1,
        isTemplate: true
      },
      {
        id: crypto.randomUUID(),
        type: 'research',
        title: '研究项目模板',
        content: '**研究阶段 (年份)**：具体研究内容和成果描述\n论文标题. **作者**, 其他作者, 年份.',
        latexContent: '\\item \\textbf{研究阶段 (年份)}：具体研究内容和成果描述\\\\\n论文标题. \\textbf{作者}, 其他作者, 年份.',
        tags: ['research', 'academic', 'template'],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        versionNumber: 1,
        isTemplate: true
      }
    ];

    for (const template of defaultTemplates) {
      await this.saveSection(template);
    }
  }
}