import { ParsedImport } from '../extractors/base/ContentExtractor.js';

/**
 * Result of framework detection with confidence scoring
 */
export interface FrameworkDetectionResult {
  framework: string | null;
  confidence: number; // 0-100, higher is more confident
  detectionMethod: 'annotation' | 'import' | 'combined';
  details?: {
    matchedAnnotations?: string[];
    matchedImports?: string[];
    ambiguousAnnotations?: string[];
  };
}

/**
 * Import pattern for framework detection
 */
export interface ImportPattern {
  pattern: string; // Package pattern (supports wildcards with *)
  confidence: number; // Confidence boost when this pattern matches
  framework: string; // Framework name this pattern indicates
}

/**
 * Context for framework detection including both annotations and imports
 */
export interface FrameworkDetectionContext {
  annotations: string[];
  imports: ParsedImport[];
  filePath?: string;
}