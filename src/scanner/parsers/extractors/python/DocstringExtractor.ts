import { BaseDocumentationExtractor } from '../base/DocumentationExtractor.js';

export class DocstringExtractor extends BaseDocumentationExtractor {
  private static readonly TRIPLE_QUOTE_DOUBLE = '"""';
  private static readonly TRIPLE_QUOTE_SINGLE = "'''";

  extractDocumentation(content: string, position: number): string | undefined {
    // Look for docstring after the function/class definition
    const afterPosition = content.substring(position);
    const lines = afterPosition.split('\n');
    
    // Skip empty lines and whitespace
    let docstringStart = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;
      
      // Check for docstring patterns
      if (line.startsWith(DocstringExtractor.TRIPLE_QUOTE_DOUBLE) || 
          line.startsWith(DocstringExtractor.TRIPLE_QUOTE_SINGLE)) {
        docstringStart = i;
        break;
      } else if (line.startsWith('#')) {
        continue; // Skip comments
      } else {
        break; // Found non-docstring content
      }
    }
    
    if (docstringStart === -1) return undefined;
    
    const docstringQuote = lines[docstringStart].includes(DocstringExtractor.TRIPLE_QUOTE_DOUBLE) 
      ? DocstringExtractor.TRIPLE_QUOTE_DOUBLE 
      : DocstringExtractor.TRIPLE_QUOTE_SINGLE;
    
    // Check if single-line docstring
    const firstLine = lines[docstringStart];
    const quoteCount = (firstLine.match(new RegExp(this.escapeRegex(docstringQuote), 'g')) || []).length;
    if (quoteCount >= 2) {
      // Single-line docstring
      return firstLine.replace(new RegExp(this.escapeRegex(docstringQuote), 'g'), '').trim();
    }
    
    // Multi-line docstring
    const docstringLines: string[] = [];
    docstringLines.push(firstLine.replace(docstringQuote, ''));
    
    for (let i = docstringStart + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(docstringQuote)) {
        docstringLines.push(line.replace(docstringQuote, ''));
        break;
      }
      docstringLines.push(line);
    }
    
    return this.joinLines(docstringLines);
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  extractDocstringSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = content.split('\n');
    
    let currentSection = 'description';
    let currentContent: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for common docstring sections
      const sectionMatch = trimmed.match(/^(Args?|Arguments?|Parameters?|Param|Returns?|Return|Yields?|Yield|Raises?|Raise|Examples?|Example|Notes?|Note):\s*$/i);
      if (sectionMatch) {
        // Save previous section
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        // Start new section
        currentSection = sectionMatch[1].toLowerCase();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    
    // Save final section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }
    
    return sections;
  }
}