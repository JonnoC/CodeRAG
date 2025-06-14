export interface ParsedMethod {
  name: string;
  parameters: ParsedParameter[];
  returnType?: string;
  modifiers: string[];
  startLine?: number;
  endLine?: number;
  body?: string;
}

export interface ParsedParameter {
  name: string;
  type?: string;
  defaultValue?: string;
  isOptional?: boolean;
}

export interface ParsedClass {
  name: string;
  extends?: string[];
  implements?: string[];
  modifiers: string[];
  startLine?: number;
  endLine?: number;
  body?: string;
}

export interface ParsedInterface {
  name: string;
  extends?: string[];
  modifiers: string[];
  startLine?: number;
  endLine?: number;
  body?: string;
}

export interface ParsedField {
  name: string;
  type?: string;
  defaultValue?: string;
  modifiers: string[];
  startLine?: number;
  endLine?: number;
}

export interface ParsedEnum {
  name: string;
  values: string[];
  modifiers: string[];
  startLine?: number;
  endLine?: number;
}

export interface ParsedImport {
  module: string;
  items?: string[];
  alias?: string;
  isDefault?: boolean;
}

export interface ContentExtractionResult {
  packageName?: string;
  moduleName?: string;
  imports: ParsedImport[];
  classes: ParsedClass[];
  interfaces: ParsedInterface[];
  enums: ParsedEnum[];
  functions: ParsedMethod[];
  fields: ParsedField[];
  exceptions: ParsedClass[];
}

export abstract class BaseContentExtractor {
  abstract extractContent(content: string, filePath: string): ContentExtractionResult;

  protected findLineNumber(content: string, searchText: string): number | undefined {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i + 1; // Line numbers are 1-based
      }
    }
    return undefined;
  }

  protected findLineRange(content: string, startText: string, endPattern: RegExp | string): { start: number; end: number } | undefined {
    const lines = content.split('\n');
    let startLine = -1;
    let endLine = -1;
    
    // Find start line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(startText)) {
        startLine = i + 1;
        break;
      }
    }
    
    if (startLine === -1) return undefined;
    
    // Find end line
    const isRegex = endPattern instanceof RegExp;
    for (let i = startLine - 1; i < lines.length; i++) {
      const line = lines[i];
      const matches = isRegex ? endPattern.test(line) : line.includes(endPattern as string);
      if (matches) {
        endLine = i + 1;
        break;
      }
    }
    
    return endLine !== -1 ? { start: startLine, end: endLine } : { start: startLine, end: startLine };
  }

  protected extractBody(content: string, startLine: number, endLine?: number): string {
    const lines = content.split('\n');
    const start = Math.max(0, startLine - 1);
    const end = endLine ? Math.min(lines.length, endLine) : lines.length;
    
    return lines.slice(start, end).join('\n');
  }

  protected parseModifiers(modifierString: string): string[] {
    const modifiers = modifierString.trim().split(/\s+/);
    return modifiers.filter(m => m && !['class', 'interface', 'enum', 'def', 'function'].includes(m));
  }

  protected parseParameters(paramString: string): ParsedParameter[] {
    if (!paramString || paramString.trim() === '') {
      return [];
    }

    const parameters: ParsedParameter[] = [];
    const params = this.splitParameters(paramString);
    
    for (const param of params) {
      const parsed = this.parseParameter(param.trim());
      if (parsed) {
        parameters.push(parsed);
      }
    }
    
    return parameters;
  }

  protected abstract parseParameter(param: string): ParsedParameter | null;

  protected splitParameters(paramString: string): string[] {
    const parameters: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < paramString.length; i++) {
      const char = paramString[i];
      const prevChar = i > 0 ? paramString[i - 1] : '';
      
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = '';
        }
      }
      
      if (!inString) {
        if (char === '(' || char === '[' || char === '{') {
          depth++;
        } else if (char === ')' || char === ']' || char === '}') {
          depth--;
        } else if (char === ',' && depth === 0) {
          parameters.push(current.trim());
          current = '';
          continue;
        }
      }
      
      current += char;
    }
    
    if (current.trim()) {
      parameters.push(current.trim());
    }
    
    return parameters;
  }
}