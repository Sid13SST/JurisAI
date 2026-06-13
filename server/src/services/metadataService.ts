export interface ExtractedMetadata {
  contractTitle: string;
  parties: string[];
  effectiveDate: string | null;
  expirationDate: string | null;
  contractCategory: 'NDA' | 'Employment' | 'Vendor' | 'Partnership' | 'SaaS' | 'DPA' | 'Other';
}

/**
 * Clean up extra spaces, quotes, and legal boilerplate words from party names
 */
function cleanPartyName(name: string): string {
  return name
    .replace(/^(each, a|a|the|individually)\s+/i, '')
    .replace(/[\"\'\(\)]/g, '') // strip quotes/parentheses
    .replace(/\s+(a corporation|a company|a limited liability company|an individual|a Delaware corporation|LLC|Inc|Corp|Ltd|Co|Incorporated)\.?\s*$/i, '')
    .trim();
}

/**
 * Searches first 3000 characters and last 3000 characters for standard date strings
 */
function extractDateWithKeyword(text: string, keywords: string[]): string | null {
  // Regex to match standard formats:
  // - "June 13, 2026"
  // - "13 June 2026"
  // - "06/13/2026" or "13/06/26"
  // - "2026-06-13"
  const dateRegex = /(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4})|(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})|(?:\d{4}-\d{2}-\d{2})|(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;

  for (const keyword of keywords) {
    const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // Look for the keyword followed by some words/punctuation (up to 40 characters) and then a date
    const pattern = new RegExp(`${escapedKeyword}\\s*(?:is|as\\s+of)?\\s*(?:the)?\\s*(?:\\d+(?:st|nd|rd|th)?\\s+day\\s+of)?\\s*(${dateRegex.source})`, 'i');
    
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

export function extractMetadata(rawText: string): ExtractedMetadata {
  const sampleHeader = rawText.substring(0, 3000);
  const sampleFooter = rawText.substring(Math.max(0, rawText.length - 3000));
  
  // 1. Detect Category
  let category: ExtractedMetadata['contractCategory'] = 'Other';
  const lowercaseText = rawText.toLowerCase();

  if (lowercaseText.includes('non-disclosure') || lowercaseText.includes('confidentiality agreement') || lowercaseText.includes('nda')) {
    category = 'NDA';
  } else if (lowercaseText.includes('employment agreement') || lowercaseText.includes('independent contractor agreement') || lowercaseText.includes('offer letter') || lowercaseText.includes('consulting agreement')) {
    category = 'Employment';
  } else if (lowercaseText.includes('software as a service') || lowercaseText.includes('saas agreement') || lowercaseText.includes('subscription agreement') || lowercaseText.includes('cloud service agreement')) {
    category = 'SaaS';
  } else if (lowercaseText.includes('data processing addendum') || lowercaseText.includes('data protection addendum') || lowercaseText.includes('dpa') || lowercaseText.includes('gdpr addendum')) {
    category = 'DPA';
  } else if (lowercaseText.includes('vendor agreement') || lowercaseText.includes('supplier agreement') || lowercaseText.includes('purchase agreement') || lowercaseText.includes('supply agreement')) {
    category = 'Vendor';
  } else if (lowercaseText.includes('partnership agreement') || lowercaseText.includes('joint venture') || lowercaseText.includes('collaboration agreement')) {
    category = 'Partnership';
  }

  // 2. Extract Contract Title
  let contractTitle = 'Untitled Contract';
  const lines = sampleHeader.split('\n');
  const titleKeywords = ['agreement', 'nda', 'contract', 'undertaking', 'policy', 'terms', 'lease', 'addendum'];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 5 && trimmed.length < 100) {
      const isTitleCandidate = titleKeywords.some(keyword => trimmed.toLowerCase().includes(keyword));
      if (isTitleCandidate) {
        contractTitle = trimmed;
        break;
      }
    }
  }

  // 3. Extract Parties
  const parties: string[] = [];
  // Scan for common legal introductory structures:
  // e.g. "by and between Party A, Inc. and Party B, LLC"
  const preambleRegexes = [
    /between\s+([A-Z][A-Za-z0-9\s,\.\(\)\-\“\”]+?)\s+(?:and|&)\s+([A-Z][A-Za-z0-9\s,\.\(\)\-\“\”]+?)(?:\s+collectively|\.|\s+constitute|\s+enter\s+into)/,
    /by\s+and\s+between\s+([A-Z][A-Za-z0-9\s,\.\(\)\-\“\”]+?)\s+(?:and|&)\s+([A-Z][A-Za-z0-9\s,\.\(\)\-\“\”]+?)(?:\s+\(|,)/,
    /among\s+([A-Z][A-Za-z0-9\s,\.\(\)\-\“\”]+?),\s+([A-Z][A-Za-z0-9\s,\.\(\)\-\“\”]+?),\s+(?:and|&)\s+([A-Z][A-Za-z0-9\s,\.\(\)\-\“\”]+?)(?:\s+\(|,)/
  ];

  // Try to find preamble in the first 1500 chars
  const intro = sampleHeader.substring(0, 1500).replace(/\s+/g, ' ');
  for (const regex of preambleRegexes) {
    const match = intro.match(regex);
    if (match) {
      // Extract matches
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          const cleaned = cleanPartyName(match[i]);
          if (cleaned && cleaned.length > 2 && cleaned.length < 80 && !parties.includes(cleaned)) {
            parties.push(cleaned);
          }
        }
      }
      break;
    }
  }

  // Fallback party search: look for capitalized blocks ending with corporate suffix in first 1000 chars
  if (parties.length < 2) {
    const suffixRegex = /([A-Z][A-Za-z0-9\s,\.\-]{1,50}?\s+(?:LLC|Inc|Corp|Ltd|Co|Incorporated|Limited))\b/g;
    let suffixMatch;
    while ((suffixMatch = suffixRegex.exec(intro)) !== null) {
      const cleaned = cleanPartyName(suffixMatch[1]);
      if (cleaned && cleaned.length > 2 && cleaned.length < 80 && !parties.includes(cleaned)) {
        parties.push(cleaned);
      }
      if (parties.length >= 2) break;
    }
  }

  // 4. Extract Effective Date
  const effectiveKeywords = ['effective date', 'made as of', 'entered into on', 'dated', 'agreement date', 'commencement date'];
  const effectiveDate = extractDateWithKeyword(sampleHeader, effectiveKeywords);

  // 5. Extract Expiration Date
  const expirationKeywords = ['expiration date', 'terminate on', 'expires on', 'termination date', 'expiration', 'end date'];
  // Scan footer first, then fallback to header
  let expirationDate = extractDateWithKeyword(sampleFooter, expirationKeywords);
  if (!expirationDate) {
    expirationDate = extractDateWithKeyword(sampleHeader, expirationKeywords);
  }

  return {
    contractTitle,
    parties: parties.length > 0 ? parties : ['Unknown Party A', 'Unknown Party B'],
    effectiveDate,
    expirationDate,
    contractCategory: category
  };
}
