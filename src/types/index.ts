export interface JobApplication {
  id: string;
  title: string;
  company: string;
  url: string;
  description: string;
  requirements: string[];
  salary?: string;
  location: string;
  workType: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  datePosted?: string;
  dateApplied?: string;
  positionId?: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  notes: string;
  matchScore?: number;
  resumeVersionId?: string;
  coverLetterVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CVDocument {
  id: string;
  name: string;
  content: string;
  type: 'pdf' | 'docx' | 'markdown' | 'latex';
  fileName: string;
  fileData: string; // base64 encoded
  skills: string[];
  experience: string[];
  education: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchAnalysis {
  jobId: string;
  cvId: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  skillsMatch: {
    matched: string[];
    missing: string[];
  };
  experienceMatch: {
    relevant: string[];
    gaps: string[];
  };
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
}

export interface ParseJobRequest {
  content: string;
  url: string;
}

export interface ParseJobResponse {
  title: string;
  company: string;
  description: string;
  requirements: string[];
  salary?: string;
  location: string;
  workType: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  datePosted?: string;
  positionId?: string;
}

export interface CVVersion {
  id: string;
  title?: string;
  versionNumber: number;
  content: string;
  format?: 'latex';
  type?: 'resume' | 'cover-letter';
  created: string;
  tags?: string[];
  note?: string;
  parentId?: string;
  hash?: string;
  linkedApplications?: string[];
}

export interface ResumeSection {
  id: string;
  type: 'education' | 'experience' | 'research' | 'skills' | 'achievements' | 'custom';
  title: string;
  content: string;
  latexContent: string;
  tags: string[];
  created: string;
  updated: string;
  versionNumber: number;
  parentId?: string;
  isTemplate: boolean;
}

export interface CVComposition {
  id: string;
  name: string;
  sectionIds: string[];
  sectionOrder: number[];
  created: string;
  updated: string;
  versionNumber: number;
}

export interface StorageData {
  applications: JobApplication[];
  cvs: CVDocument[];
  cvVersions: CVVersion[];
  resumeSections: ResumeSection[];
  cvCompositions: CVComposition[];
  config: {
    openaiApiKey?: string;
  };
}