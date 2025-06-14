import { BaseDocumentationExtractor } from '../base/DocumentationExtractor.js';

export class JsDocExtractor extends BaseDocumentationExtractor {
  private static readonly JSDOC_PATTERNS = [
    /\/\*\*/g,  // /** start marker
    /\*\//g,    // */ end marker
    /^\s*\*/gm  // * line continuation markers
  ];

  extractDocumentation(content: string, position: number): string | undefined {
    // Look backwards for JSDoc comment
    const beforePosition = content.substring(0, position);
    const lines = beforePosition.split('\n');
    
    // Look for /** ... */ pattern just before the declaration
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.endsWith('*/')) {
        // Found end of JSDoc, now find the start
        const jsdocLines: string[] = [];
        let foundStart = false;
        
        for (let j = i; j >= 0; j--) {
          const docLine = lines[j].trim();
          jsdocLines.unshift(docLine);
          
          if (docLine.startsWith('/**')) {
            foundStart = true;
            break;
          }
        }
        
        if (foundStart) {
          const rawContent = this.joinLines(jsdocLines);
          return this.cleanCommentMarkers(rawContent, JsDocExtractor.JSDOC_PATTERNS);
        }
      } else if (line && !this.isEmptyOrComment(line, ['*', '//'])) {
        // Found non-comment content, stop looking
        break;
      }
    }
    
    return undefined;
  }

  extractFromAstNode(node: any): string | undefined {
    // Extract JSDoc from AST node's leading comments
    if (!node || !node.leadingComments) {
      return undefined;
    }

    for (const comment of node.leadingComments) {
      if (comment.type === 'Block' && comment.value.startsWith('*')) {
        const rawContent = `/**${comment.value}*/`;
        return this.cleanCommentMarkers(rawContent, JsDocExtractor.JSDOC_PATTERNS);
      }
    }

    return undefined;
  }

  extractJSDocTags(content: string): Record<string, string[]> {
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

  extractTypeScriptSpecificTags(content: string): {
    typeParameters?: string[];
    genericConstraints?: Record<string, string>;
    decorators?: string[];
  } {
    const result: any = {};
    const tags = this.extractJSDocTags(content);
    
    // Extract TypeScript-specific information
    if (tags.template) {
      result.typeParameters = tags.template;
    }
    
    if (tags.decorator) {
      result.decorators = tags.decorator;
    }
    
    // Extract generic constraints from @template tags
    if (tags.template) {
      const constraints: Record<string, string> = {};
      for (const template of tags.template) {
        const constraintMatch = template.match(/(\w+)\s+extends\s+(.+)/);
        if (constraintMatch) {
          constraints[constraintMatch[1]] = constraintMatch[2];
        }
      }
      if (Object.keys(constraints).length > 0) {
        result.genericConstraints = constraints;
      }
    }
    
    return result;
  }
}