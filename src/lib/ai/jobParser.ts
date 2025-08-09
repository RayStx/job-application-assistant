import { OpenAIClient } from './openai';
import type { ParseJobRequest, ParseJobResponse, OpenAIConfig } from '@/types';

export class JobParser {
  private ai: OpenAIClient;

  constructor(config: OpenAIConfig) {
    this.ai = new OpenAIClient(config);
  }

  async parseJobPosting(request: ParseJobRequest): Promise<ParseJobResponse> {
    const truncatedContent = this.truncateContent(request.content, 8000);
    
    const systemMessage = {
      role: 'system' as const,
      content: `Extract job information from the provided content (which may be in Chinese or English) and return as JSON.

IMPORTANT: Extract the EXACT text as it appears, do NOT summarize or paraphrase.

Required format:
{
  "title": "exact job title as written",
  "company": "exact company name as written",
  "description": "full job description text exactly as written, do not summarize",
  "requirements": ["exact requirement 1 as written", "exact requirement 2 as written"],
  "salary": "exact salary text or null",
  "location": "exact location text as written",
  "workType": "remote" or "hybrid" or "onsite",
  "datePosted": "exact date as written or null",
  "positionId": "exact position ID as written or null"
}

Copy the exact text, preserve original language (Chinese/English), do NOT rewrite or summarize anything.`
    };

    const userMessage = {
      role: 'user' as const,
      content: `Parse this job posting from ${request.url}:\n\n${truncatedContent}`
    };

    try {
      console.log('Parsing content length:', truncatedContent.length);
      console.log('Content preview:', truncatedContent.substring(0, 200));
      
      const result = await this.ai.parseJSON<ParseJobResponse>([systemMessage, userMessage], 3000);
      
      console.log('AI parsing result:', result);
      
      // Validate the response has required fields
      if (!result.title || !result.company) {
        console.error('Missing required fields:', { title: result.title, company: result.company });
        throw new Error('Failed to extract required job information');
      }

      return result;
    } catch (error) {
      console.error('Job parsing failed:', error);
      if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error('AI returned invalid response format');
      }
      throw new Error(`Failed to parse job posting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Try to truncate at word boundaries
    const truncated = content.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    return lastSpaceIndex > maxLength * 0.8 
      ? truncated.substring(0, lastSpaceIndex) + '...'
      : truncated + '...';
  }

  async extractPageContent(tabId: number): Promise<string> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Remove unwanted elements but preserve structure
          const unwanted = document.querySelectorAll('script, style, noscript, iframe, nav, header, footer, .nav, .menu, .sidebar, .ads, .advertisement');
          unwanted.forEach(el => el.remove());
          
          // Function to extract text while preserving list structure
          function extractStructuredText(element) {
            let text = '';
            
            for (const node of element.childNodes) {
              if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent.trim() + ' ';
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                
                // Handle list items with numbers/bullets
                if (tagName === 'li') {
                  const listText = extractStructuredText(node).trim();
                  if (listText) {
                    // Add appropriate formatting for list items
                    text += '\n' + listText + '\n';
                  }
                }
                // Handle ordered/unordered lists
                else if (tagName === 'ol' || tagName === 'ul') {
                  text += '\n' + extractStructuredText(node) + '\n';
                }
                // Handle paragraphs and divs
                else if (tagName === 'p' || tagName === 'div') {
                  const paraText = extractStructuredText(node).trim();
                  if (paraText) {
                    text += '\n' + paraText + '\n';
                  }
                }
                // Handle line breaks
                else if (tagName === 'br') {
                  text += '\n';
                }
                // Handle other elements recursively
                else {
                  text += extractStructuredText(node);
                }
              }
            }
            
            return text;
          }
          
          // Extract structured content from body
          let content = extractStructuredText(document.body || document.documentElement);
          
          // Clean up excessive whitespace while preserving line breaks for lists
          content = content
            .replace(/[ \t]+/g, ' ')  // Multiple spaces/tabs to single space
            .replace(/\n[ \t]+/g, '\n')  // Remove spaces after newlines
            .replace(/[ \t]+\n/g, '\n')  // Remove spaces before newlines
            .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
            .trim();
          
          return content;
        }
      });

      return results[0]?.result || '';
    } catch (error) {
      console.error('Failed to extract page content:', error);
      throw new Error('Could not access page content. Make sure you have permission to read this page.');
    }
  }
}