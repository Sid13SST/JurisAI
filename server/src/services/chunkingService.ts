import { StructuredSection } from './parserService';

export interface TextChunk {
  id: string;
  chunkIndex: number;
  sections: StructuredSection[];
  text: string;
  info: string;
}

// Capping chunks at roughly 12,000 characters (~2,000 to 2,500 words) for optimal latency and processing
const MAX_CHUNK_CHAR_LIMIT = 15000;

/**
 * Partitions a flat array of document sections into chunk groups
 */
export function chunkContractSections(sections: StructuredSection[]): TextChunk[] {
  const chunks: TextChunk[] = [];
  
  if (!sections || sections.length === 0) {
    return chunks;
  }

  let currentChunkSections: StructuredSection[] = [];
  let currentChunkLength = 0;
  let chunkIndex = 0;

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const sectionText = `${sec.sectionNumber ? `${sec.sectionNumber} ` : ''}${sec.title}\n${sec.content}\n\n`;
    const sectionLength = sectionText.length;

    // If adding this section exceeds the limit and we already have sections in the chunk,
    // finalize the current chunk first.
    if (currentChunkLength + sectionLength > MAX_CHUNK_CHAR_LIMIT && currentChunkSections.length > 0) {
      chunks.push(createChunkObject(chunkIndex++, currentChunkSections));
      currentChunkSections = [];
      currentChunkLength = 0;
    }

    currentChunkSections.push(sec);
    currentChunkLength += sectionLength;
  }

  // Add final chunk
  if (currentChunkSections.length > 0) {
    chunks.push(createChunkObject(chunkIndex, currentChunkSections));
  }

  return chunks;
}

/**
 * Helper to build the final TextChunk structure
 */
function createChunkObject(index: number, sections: StructuredSection[]): TextChunk {
  const text = sections
    .map(s => `${s.sectionNumber ? `${s.sectionNumber} ` : ''}${s.title}\n${s.content}`)
    .join('\n\n');

  const startSec = sections[0].sectionNumber || `#${sections[0].title.substring(0, 15)}`;
  const endSec = sections[sections.length - 1].sectionNumber || `#${sections[sections.length - 1].title.substring(0, 15)}`;
  const info = `Chunk ${index + 1} - Sections: (${startSec} to ${endSec})`;

  return {
    id: `chunk-${index}-${Math.random().toString(36).substring(2, 6)}`,
    chunkIndex: index,
    sections,
    text,
    info
  };
}
