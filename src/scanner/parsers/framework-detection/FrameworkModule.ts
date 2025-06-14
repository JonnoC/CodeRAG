import { 
  FrameworkDetectionResult, 
  FrameworkDetectionContext, 
  ImportPattern 
} from './FrameworkDetectionTypes.js';
import { ParsedImport } from '../extractors/base/ContentExtractor.js';

/**
 * Abstract base class for framework modules.
 * Each framework (e.g., Spring Boot, Angular, Flask) should extend this class.
 */
export abstract class FrameworkModule {
  protected frameworkMap: Map<string, string> = new Map();
  protected categoryMap: Map<string, string> = new Map();
  protected importPatterns: ImportPattern[] = [];

  /**
   * Get the name of this framework
   */
  abstract getFrameworkName(): string;

  /**
   * Get all supported annotations for this framework
   */
  getSupportedAnnotations(): string[] {
    return Array.from(this.frameworkMap.keys());
  }

  /**
   * Get all supported categories for this framework
   */
  getSupportedCategories(): string[] {
    return Array.from(new Set(this.categoryMap.values()));
  }

  /**
   * Detect if an annotation belongs to this framework
   */
  detectFramework(annotation: string): string | null {
    return this.frameworkMap.get(annotation) || null;
  }

  /**
   * Get the category for an annotation
   */
  categorizeAnnotation(annotation: string): string | null {
    return this.categoryMap.get(annotation) || null;
  }

  /**
   * Get the framework map for this module
   */
  getFrameworkMap(): Map<string, string> {
    return new Map(this.frameworkMap);
  }

  /**
   * Get the category map for this module
   */
  getCategoryMap(): Map<string, string> {
    return new Map(this.categoryMap);
  }

  /**
   * Initialize the framework mappings
   * This method should be called in the constructor of concrete implementations
   */
  protected abstract initializeMappings(): void;

  /**
   * Detect framework from import patterns
   */
  detectFrameworkFromImports(imports: ParsedImport[]): FrameworkDetectionResult {
    let bestMatch: { framework: string; confidence: number } | null = null;
    const matchedImports: string[] = [];

    for (const importItem of imports) {
      for (const pattern of this.importPatterns) {
        if (this.matchesImportPattern(importItem.module, pattern.pattern)) {
          matchedImports.push(importItem.module);
          
          if (!bestMatch || pattern.confidence > bestMatch.confidence) {
            bestMatch = {
              framework: pattern.framework,
              confidence: pattern.confidence
            };
          }
        }
      }
    }

    if (bestMatch) {
      return {
        framework: bestMatch.framework,
        confidence: bestMatch.confidence,
        detectionMethod: 'import',
        details: {
          matchedImports
        }
      };
    }

    return {
      framework: null,
      confidence: 0,
      detectionMethod: 'import'
    };
  }

  /**
   * Enhanced framework detection using both annotations and imports
   */
  detectFrameworkWithContext(context: FrameworkDetectionContext): FrameworkDetectionResult {
    const annotationResult = this.detectFrameworkFromAnnotations(context.annotations);
    const importResult = this.detectFrameworkFromImports(context.imports);

    // If both methods agree on the framework, combine confidence
    if (annotationResult.framework === importResult.framework && annotationResult.framework) {
      return {
        framework: annotationResult.framework,
        confidence: Math.min(100, annotationResult.confidence + importResult.confidence),
        detectionMethod: 'combined',
        details: {
          matchedAnnotations: annotationResult.details?.matchedAnnotations,
          matchedImports: importResult.details?.matchedImports
        }
      };
    }

    // Return the result with higher confidence
    if (importResult.confidence > annotationResult.confidence) {
      return importResult;
    }

    return annotationResult;
  }

  /**
   * Detect framework from annotations with confidence scoring
   */
  detectFrameworkFromAnnotations(annotations: string[]): FrameworkDetectionResult {
    const matchedAnnotations: string[] = [];
    const frameworkCounts = new Map<string, number>();

    for (const annotation of annotations) {
      const framework = this.frameworkMap.get(annotation);
      if (framework) {
        matchedAnnotations.push(annotation);
        frameworkCounts.set(framework, (frameworkCounts.get(framework) || 0) + 1);
      }
    }

    if (frameworkCounts.size === 0) {
      return {
        framework: null,
        confidence: 0,
        detectionMethod: 'annotation'
      };
    }

    // Find framework with most matches
    let bestFramework = '';
    let maxCount = 0;
    for (const [framework, count] of frameworkCounts) {
      if (count > maxCount) {
        bestFramework = framework;
        maxCount = count;
      }
    }

    // Calculate confidence based on number of matches and specificity
    const confidence = Math.min(90, maxCount * 20); // Cap at 90 to leave room for import boost

    return {
      framework: bestFramework,
      confidence,
      detectionMethod: 'annotation',
      details: {
        matchedAnnotations
      }
    };
  }

  /**
   * Check if an import module matches a pattern
   */
  private matchesImportPattern(module: string, pattern: string): boolean {
    // Convert pattern to regex (handle wildcards)
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      + '$';
    
    const regex = new RegExp(regexPattern);
    return regex.test(module);
  }

  /**
   * Get import patterns for this framework
   */
  getImportPatterns(): ImportPattern[] {
    return [...this.importPatterns];
  }

  /**
   * Add an import pattern for framework detection
   */
  protected addImportPattern(pattern: string, confidence: number, framework?: string): void {
    this.importPatterns.push({
      pattern,
      confidence,
      framework: framework || this.getFrameworkName()
    });
  }
}