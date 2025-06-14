export interface FrameworkDetector {
  detectFramework(annotationName: string): string | undefined;
  categorizeAnnotation(annotationName: string): string | undefined;
  getSupportedFrameworks(): string[];
  getSupportedCategories(): string[];
}

export abstract class BaseFrameworkDetector implements FrameworkDetector {
  protected abstract frameworkMap: Record<string, string>;
  protected abstract categoryMap: Record<string, string>;

  detectFramework(annotationName: string): string | undefined {
    return this.frameworkMap[annotationName];
  }

  categorizeAnnotation(annotationName: string): string | undefined {
    return this.categoryMap[annotationName];
  }

  getSupportedFrameworks(): string[] {
    return Array.from(new Set(Object.values(this.frameworkMap)));
  }

  getSupportedCategories(): string[] {
    return Array.from(new Set(Object.values(this.categoryMap)));
  }
}