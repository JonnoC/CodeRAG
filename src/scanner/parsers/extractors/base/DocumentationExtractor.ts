export interface DocumentationExtractor {
  extractDocumentation(content: string, position: number): string | undefined;
}

export abstract class BaseDocumentationExtractor implements DocumentationExtractor {
  abstract extractDocumentation(content: string, position: number): string | undefined;

  protected cleanCommentMarkers(content: string, patterns: RegExp[]): string {
    let cleaned = content;
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }
    return cleaned.trim();
  }

  protected joinLines(lines: string[]): string {
    return lines.join('\n').trim();
  }

  protected isEmptyOrComment(line: string, commentMarkers: string[]): boolean {
    const trimmed = line.trim();
    if (trimmed === '') return true;
    
    return commentMarkers.some(marker => trimmed.startsWith(marker));
  }

  protected findBoundary(lines: string[], startIndex: number, direction: 'forward' | 'backward', stopConditions: (line: string) => boolean): number {
    const increment = direction === 'forward' ? 1 : -1;
    const limit = direction === 'forward' ? lines.length : -1;
    
    for (let i = startIndex; i !== limit; i += increment) {
      if (stopConditions(lines[i])) {
        return i;
      }
    }
    
    return -1;
  }
}