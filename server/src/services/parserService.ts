import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export interface StructuredSection {
  id: string;
  sectionNumber: string;
  title: string;
  content: string;
  level: number;
}

export interface ExtractedDocument {
  rawText: string;
  pageCount: number;
  wordCount: number;
  structuredText: StructuredSection[];
}

/**
 * Standardizes raw text by clean up spacing and carriage returns
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Helper to generate random IDs for structured sections
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Parses raw text line-by-line to extract sections, subsections, and appendices
 */
export function buildDocumentStructure(rawText: string): StructuredSection[] {
  const lines = rawText.split('\n');
  const sections: StructuredSection[] = [];
  
  // Regular expressions for detecting headers
  const sectionHeaderRegex = /^(?:SECTION|ARTICLE)\s+([A-Z0-9\-\.]+)\.?\s*([A-Za-z0-9\s,:\(\)\-]{2,80})?$/i;
  const appendixRegex = /^(?:SCHEDULE|APPENDIX|EXHIBIT)\s+([A-Z0-9\-\.]+)\.?\s*([A-Za-z0-9\s,:\(\)\-]{2,80})?$/i;
  const numberedHeaderRegex = /^(\d+(?:\.\d+){1,3})\.?\s+([A-Z0-9][A-Za-z0-9\s,:\(\)\-]{2,80})$/;

  let currentSection: StructuredSection = {
    id: generateId(),
    sectionNumber: '0',
    title: 'Recitals & Preamble',
    content: '',
    level: 1
  };

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    let match: RegExpMatchArray | null = null;
    let number = '';
    let title = '';
    let level = 1;
    let isHeader = false;

    // Check SECTION / ARTICLE
    if ((match = line.match(sectionHeaderRegex))) {
      number = match[1];
      title = (match[2] || `Section ${number}`).trim();
      level = 1;
      isHeader = true;
    }
    // Check SCHEDULE / APPENDIX
    else if ((match = line.match(appendixRegex))) {
      number = match[1];
      title = (match[2] || `Schedule ${number}`).trim();
      level = 1;
      isHeader = true;
    }
    // Check Numbered Outline e.g. 1.1, 1.1.1
    else if ((match = line.match(numberedHeaderRegex))) {
      number = match[1];
      title = match[2].trim();
      const dotCount = (number.match(/\./g) || []).length;
      level = Math.min(dotCount + 1, 3); // cap hierarchy level at 3
      isHeader = true;
    }

    if (isHeader) {
      // Push previous section if it has content
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection, content: currentSection.content.trim() });
      }
      
      currentSection = {
        id: generateId(),
        sectionNumber: number,
        title,
        content: '',
        level
      };
    } else {
      currentSection.content += line + '\n';
    }
  }

  // Push final section
  if (currentSection.content.trim() || sections.length === 0) {
    sections.push({ ...currentSection, content: currentSection.content.trim() });
  }

  return sections;
}

/**
 * Extracts raw text and page counts from PDF buffer
 */
export async function parsePDF(buffer: Buffer): Promise<ExtractedDocument> {
  const data = await pdf(buffer);
  const rawText = cleanText(data.text);
  const pageCount = data.numpages || 1;
  const wordCount = rawText ? rawText.split(/\s+/).length : 0;
  const structuredText = buildDocumentStructure(rawText);

  return {
    rawText,
    pageCount,
    wordCount,
    structuredText
  };
}

/**
 * Extracts HTML structure, text, and list hierarchies from DOCX buffer
 */
export async function parseDOCX(buffer: Buffer): Promise<ExtractedDocument> {
  // Extract HTML using mammoth to preserve paragraphs, lists, and headers
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;
  
  // Extract clean plain text for word counts
  const textResult = await mammoth.extractRawText({ buffer });
  const rawText = cleanText(textResult.value);
  const wordCount = rawText ? rawText.split(/\s+/).length : 0;
  
  // Estimate page count for DOCX (roughly 350-400 words per page is a standard industry rule of thumb)
  const pageCount = Math.max(Math.ceil(wordCount / 380), 1);

  // Parse sections based on HTML tags
  const sections: StructuredSection[] = [];
  const tagRegex = /<(h1|h2|h3|p|li)[^>]*>(.*?)<\/\1>/gi;
  
  let currentSection: StructuredSection = {
    id: generateId(),
    sectionNumber: '0',
    title: 'Recitals & Preamble',
    content: '',
    level: 1
  };

  const numberedHeaderRegex = /^(\d+(?:\.\d+){1,3})\.?\s+([A-Z0-9][A-Za-z0-9\s,:\(\)\-]{2,80})$/;

  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1];
    // Strip HTML formatting inside tags for cleaner reading
    const textContent = match[2].replace(/<[^>]*>/g, '').trim();
    if (!textContent) continue;

    let isHeader = false;
    let number = '';
    let title = '';
    let level = 1;

    // Check heading tags
    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      isHeader = true;
      level = tag === 'h1' ? 1 : tag === 'h2' ? 2 : 3;
      title = textContent;
      
      // Attempt to pull out numbers like "1. Definitions" inside header
      const numMatch = textContent.match(/^(\d+(?:\.\d+)*)\.?\s+(.*)$/);
      if (numMatch) {
        number = numMatch[1];
        title = numMatch[2];
      }
    } 
    // Check if a normal paragraph starts with an outline pattern e.g. "1.1 Service Details"
    else if (tag === 'p') {
      const numMatch = textContent.match(numberedHeaderRegex);
      if (numMatch) {
        isHeader = true;
        number = numMatch[1];
        title = numMatch[2];
        const dotCount = (number.match(/\./g) || []).length;
        level = Math.min(dotCount + 1, 3);
      }
    }

    if (isHeader) {
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection, content: currentSection.content.trim() });
      }
      currentSection = {
        id: generateId(),
        sectionNumber: number,
        title,
        content: '',
        level
      };
    } else {
      currentSection.content += textContent + '\n';
    }
  }

  if (currentSection.content.trim() || sections.length === 0) {
    sections.push({ ...currentSection, content: currentSection.content.trim() });
  }

  return {
    rawText,
    pageCount,
    wordCount,
    structuredText: sections
  };
}
