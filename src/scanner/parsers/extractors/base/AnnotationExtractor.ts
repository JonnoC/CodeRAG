import { AnnotationInfo } from '../../../../types.js';

/**
 * Parameters for annotation extraction
 */
export interface ParsedAnnotationParameter {
  name?: string;
  value: string;
  type?: string;
}

/**
 * Result of annotation extraction
 */
export interface AnnotationExtractionResult {
  annotations: AnnotationInfo[];
  errors: string[];
}

/**
 * Base interface for annotation extraction across different languages
 */
export interface IAnnotationExtractor {
  /**
   * Extract annotations/decorators from source code at a specific position
   */
  extractAnnotations(
    content: string,
    entityPosition: number,
    additionalContext?: any
  ): AnnotationExtractionResult;

  /**
   * Parse annotation parameters from a parameter string
   */
  parseAnnotationParameters(parametersString?: string): ParsedAnnotationParameter[];

  /**
   * Detect which framework an annotation belongs to
   */
  detectFramework(annotationName: string): string | undefined;

  /**
   * Categorize an annotation by its purpose
   */
  categorizeAnnotation(annotationName: string): string | undefined;
}

/**
 * Abstract base class providing common functionality for annotation extractors
 */
export abstract class BaseAnnotationExtractor implements IAnnotationExtractor {
  
  abstract extractAnnotations(
    content: string,
    entityPosition: number,
    additionalContext?: any
  ): AnnotationExtractionResult;

  abstract parseAnnotationParameters(parametersString?: string): ParsedAnnotationParameter[];

  abstract detectFramework(annotationName: string): string | undefined;

  abstract categorizeAnnotation(annotationName: string): string | undefined;

  /**
   * Helper method to split complex parameter strings safely
   */
  protected splitParameters(paramString: string, delimiter: string = ','): string[] {
    const parameters: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < paramString.length; i++) {
      const char = paramString[i];
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
        stringChar = '';
      } else if (!inString) {
        if (char === '(' || char === '[' || char === '{') {
          depth++;
        } else if (char === ')' || char === ']' || char === '}') {
          depth--;
        } else if (char === delimiter && depth === 0) {
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

  /**
   * Helper method to infer parameter type from a value string
   */
  protected inferParameterType(value: string): string {
    value = value.trim();
    
    if (value.startsWith('"') || value.startsWith("'")) return 'string';
    if (value === 'true' || value === 'false' || value === 'True' || value === 'False') return 'boolean';
    if (value === 'null' || value === 'None' || value === 'undefined') return 'null';
    if (/^\d+$/.test(value)) return 'number';
    if (/^\d+\.\d+$/.test(value)) return 'number';
    if (value.startsWith('[') || value.startsWith('(') || value.startsWith('{')) return 'collection';
    
    return 'identifier';
  }

  /**
   * Helper method to remove quotes from string values
   */
  protected removeQuotes(value: string): string {
    return value.replace(/^["']|["']$/g, '');
  }

  /**
   * Helper method to find content before a specific position in the source
   */
  protected getContentBefore(content: string, position: number): string[] {
    return content.substring(0, position).split('\n');
  }

  /**
   * Helper method to check if a line is a comment
   */
  protected abstract isCommentLine(line: string): boolean;

  /**
   * Helper method to check if a line is an annotation/decorator
   */
  protected abstract isAnnotationLine(line: string): boolean;
}