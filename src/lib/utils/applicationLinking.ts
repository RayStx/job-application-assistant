import { ApplicationStorage } from '@/lib/storage/applications';
import type { JobApplication } from '@/types';

/**
 * Unified logic for loading linked applications for any document type
 * This eliminates duplicate code between Resume and Cover Letter components
 */
export async function loadLinkedApplicationsForDocument(
  documentId: string, 
  documentType: 'resume' | 'cover-letter'
): Promise<JobApplication[]> {
  try {
    const appStorage = new ApplicationStorage();
    const allApplications = await appStorage.getAll();
    
    // Filter applications based on document type
    const fieldName = documentType === 'resume' ? 'resumeVersionId' : 'coverLetterVersionId';
    const linked = allApplications.filter(app => app[fieldName] === documentId);
    
    return linked;
  } catch (error) {
    console.error(`Failed to load linked applications for ${documentType}:`, error);
    return [];
  }
}

/**
 * Get display name for document consistently
 */
export function getDocumentDisplayName(document: any, documentType: 'resume' | 'cover-letter'): string {
  const defaultName = documentType === 'resume' ? 'Resume' : 'Cover Letter';
  return document?.title || defaultName;
}

/**
 * Get document version display consistently  
 * Note: No longer showing version numbers for standalone documents
 */
export function getDocumentVersionDisplay(document: any): string {
  return ''; // Version numbers no longer displayed for standalone documents
}