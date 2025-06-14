import { BaseFrameworkDetector } from '../FrameworkDetector.js';
import { FrameworkModule } from '../FrameworkModule.js';
import { 
  FrameworkDetectionResult, 
  FrameworkDetectionContext 
} from '../FrameworkDetectionTypes.js';
import { ParsedImport } from '../../extractors/base/ContentExtractor.js';
import { SpringBootFramework } from './frameworks/SpringBootFramework.js';
import { JPAFramework } from './frameworks/JPAFramework.js';
import { JUnitFramework } from './frameworks/JUnitFramework.js';
import { MockitoFramework } from './frameworks/MockitoFramework.js';
import { BeanValidationFramework } from './frameworks/BeanValidationFramework.js';
import { LombokFramework } from './frameworks/LombokFramework.js';
import { JavaCoreFramework } from './frameworks/JavaCoreFramework.js';

/**
 * Java framework detector that aggregates multiple framework modules
 */
export class JavaFrameworkDetector extends BaseFrameworkDetector {
  private frameworkModules: FrameworkModule[];
  protected frameworkMap: Record<string, string> = {};
  protected categoryMap: Record<string, string> = {};

  constructor() {
    super();
    this.frameworkModules = [
      new SpringBootFramework(),
      new JPAFramework(),
      new JUnitFramework(),
      new MockitoFramework(),
      new BeanValidationFramework(),
      new LombokFramework(),
      new JavaCoreFramework()
    ];
    this.initializeMaps();
  }

  /**
   * Initialize the aggregated framework and category maps from all modules
   */
  private initializeMaps(): void {
    for (const module of this.frameworkModules) {
      // Merge framework maps
      const moduleFrameworkMap = module.getFrameworkMap();
      for (const [annotation, framework] of moduleFrameworkMap) {
        this.frameworkMap[annotation] = framework;
      }

      // Merge category maps
      const moduleCategoryMap = module.getCategoryMap();
      for (const [annotation, category] of moduleCategoryMap) {
        this.categoryMap[annotation] = category;
      }
    }
  }

  /**
   * Get all framework modules
   */
  getFrameworkModules(): FrameworkModule[] {
    return [...this.frameworkModules];
  }

  /**
   * Get a specific framework module by name
   */
  getFrameworkModule(frameworkName: string): FrameworkModule | undefined {
    return this.frameworkModules.find(module => 
      module.getFrameworkName() === frameworkName
    );
  }

  /**
   * Add a new framework module
   */
  addFrameworkModule(module: FrameworkModule): void {
    this.frameworkModules.push(module);
    
    // Update maps with new module data
    const moduleFrameworkMap = module.getFrameworkMap();
    for (const [annotation, framework] of moduleFrameworkMap) {
      this.frameworkMap[annotation] = framework;
    }

    const moduleCategoryMap = module.getCategoryMap();
    for (const [annotation, category] of moduleCategoryMap) {
      this.categoryMap[annotation] = category;
    }
  }

  /**
   * Remove a framework module by name
   */
  removeFrameworkModule(frameworkName: string): boolean {
    const index = this.frameworkModules.findIndex(module => 
      module.getFrameworkName() === frameworkName
    );
    
    if (index === -1) {
      return false;
    }

    this.frameworkModules.splice(index, 1);
    this.reinitializeMaps();
    return true;
  }

  /**
   * Reinitialize maps after module removal
   */
  private reinitializeMaps(): void {
    this.frameworkMap = {};
    this.categoryMap = {};
    this.initializeMaps();
  }

  /**
   * Enhanced framework detection using both annotations and imports
   */
  detectFrameworkWithContext(context: FrameworkDetectionContext): FrameworkDetectionResult {
    const results: FrameworkDetectionResult[] = [];
    
    // Get detection results from all framework modules
    for (const module of this.frameworkModules) {
      const result = module.detectFrameworkWithContext(context);
      if (result.framework && result.confidence > 0) {
        results.push(result);
      }
    }

    if (results.length === 0) {
      return {
        framework: null,
        confidence: 0,
        detectionMethod: 'combined'
      };
    }

    // Return the result with highest confidence
    return results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }

  /**
   * Detect framework from imports across all modules
   */
  detectFrameworkFromImports(imports: ParsedImport[]): FrameworkDetectionResult {
    const results: FrameworkDetectionResult[] = [];
    
    for (const module of this.frameworkModules) {
      const result = module.detectFrameworkFromImports(imports);
      if (result.framework && result.confidence > 0) {
        results.push(result);
      }
    }

    if (results.length === 0) {
      return {
        framework: null,
        confidence: 0,
        detectionMethod: 'import'
      };
    }

    // Return the result with highest confidence
    return results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }

  /**
   * Get statistics about loaded framework modules
   */
  getFrameworkStatistics(): {
    totalModules: number;
    totalAnnotations: number;
    totalImportPatterns: number;
    moduleBreakdown: Array<{
      name: string;
      annotationCount: number;
      categoryCount: number;
      importPatternCount: number;
    }>;
  } {
    const moduleBreakdown = this.frameworkModules.map(module => ({
      name: module.getFrameworkName(),
      annotationCount: module.getSupportedAnnotations().length,
      categoryCount: module.getSupportedCategories().length,
      importPatternCount: module.getImportPatterns().length
    }));

    const totalImportPatterns = this.frameworkModules.reduce(
      (total, module) => total + module.getImportPatterns().length, 
      0
    );

    return {
      totalModules: this.frameworkModules.length,
      totalAnnotations: Object.keys(this.frameworkMap).length,
      totalImportPatterns,
      moduleBreakdown
    };
  }
}