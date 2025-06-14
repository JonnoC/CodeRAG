import { BaseDocumentationExtractor } from '../base/DocumentationExtractor.js';

export class JavaDocExtractor extends BaseDocumentationExtractor {
  private static readonly JAVADOC_PATTERNS = [
    /\/\*\*/g,  // /** start marker
    /\*\//g,    // */ end marker
    /^\s*\*/gm  // * line continuation markers
  ];

  extractDocumentation(content: string, position: number): string | undefined {
    // Look backwards for JavaDoc comment
    const beforePosition = content.substring(0, position);
    const lines = beforePosition.split('\n');
    
    // Look for /** ... */ pattern just before the declaration
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.endsWith('*/')) {
        // Found end of JavaDoc, now find the start
        const javadocLines: string[] = [];
        let foundStart = false;
        
        for (let j = i; j >= 0; j--) {
          const docLine = lines[j].trim();
          javadocLines.unshift(docLine);
          
          if (docLine.startsWith('/**')) {
            foundStart = true;
            break;
          }
        }
        
        if (foundStart) {
          const rawContent = this.joinLines(javadocLines);
          return this.cleanCommentMarkers(rawContent, JavaDocExtractor.JAVADOC_PATTERNS);
        }
      } else if (line && !this.isEmptyOrComment(line, ['*', '//'])) {
        // Found non-comment content, stop looking
        break;
      }
    }
    
    return undefined;
  }

  extractJavaDocTags(content: string): Record<string, string[]> {
    const tags: Record<string, string[]> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      const tagMatch = trimmed.match(/^@(\w+)\s*(.*)$/);
      if (tagMatch) {
        const [, tagName, tagContent] = tagMatch;
        if (!tags[tagName]) {
          tags[tagName] = [];
        }
        tags[tagName].push(tagContent.trim());
      }
    }
    
    return tags;
  }
}