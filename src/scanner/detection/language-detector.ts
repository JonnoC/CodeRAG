import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { LanguageDetector, Language } from '../types.js';
import { ProjectBuildFileDetector } from './build-file-detector.js';

export class ProjectLanguageDetector implements LanguageDetector {
  private buildFileDetector: ProjectBuildFileDetector;

  constructor() {
    this.buildFileDetector = new ProjectBuildFileDetector();
  }

  async detectFromBuildFiles(projectPath: string): Promise<Language[]> {
    try {
      const result = await this.buildFileDetector.detect(projectPath);
      return result.detectedLanguages;
    } catch (error) {
      console.warn(`Failed to detect languages from build files: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async detectFromFileExtensions(projectPath: string): Promise<Language[]> {
    const detectedLanguages: Language[] = [];

    try {
      // Find all source files
      const files = await glob('**/*.{ts,tsx,js,jsx,java,py,cs}', {
        cwd: projectPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**', 'target/**', 'coverage/**']
      });

      const extensions = new Set(files.map(f => path.extname(f).toLowerCase()));

      // Map extensions to languages
      if (extensions.has('.ts') || extensions.has('.tsx')) {
        detectedLanguages.push('typescript');
      }
      if (extensions.has('.js') || extensions.has('.jsx')) {
        detectedLanguages.push('javascript');
      }
      if (extensions.has('.java')) {
        detectedLanguages.push('java');
      }
      if (extensions.has('.py')) {
        detectedLanguages.push('python');
      }
      if (extensions.has('.cs')) {
        detectedLanguages.push('csharp');
      }

      return detectedLanguages;
    } catch (error) {
      console.warn(`Failed to detect languages from file extensions: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async detectPrimaryLanguage(languages: Language[], projectPath: string): Promise<Language | undefined> {
    if (languages.length === 0) return undefined;
    if (languages.length === 1) return languages[0];

    // First, try to determine primary language from build files
    const buildFileResult = await this.buildFileDetector.detect(projectPath);
    if (buildFileResult.primaryLanguage) {
      return buildFileResult.primaryLanguage;
    }

    // Fallback: count files by language
    const languageCounts: Record<Language, number> = {} as any;

    for (const lang of languages) {
      const extensions = this.getLanguageExtensions(lang);
      let count = 0;

      for (const ext of extensions) {
        try {
          const files = await glob(`**/*${ext}`, {
            cwd: projectPath,
            ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**', 'target/**']
          });
          count += files.length;
        } catch (error) {
          // Continue with other extensions
        }
      }

      languageCounts[lang] = count;
    }

    // Return language with most files
    const sortedLanguages = Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a);

    return sortedLanguages[0]?.[0] as Language;
  }

  private getLanguageExtensions(language: Language): string[] {
    switch (language) {
      case 'typescript': return ['.ts', '.tsx'];
      case 'javascript': return ['.js', '.jsx'];
      case 'java': return ['.java'];
      case 'python': return ['.py'];
      case 'csharp': return ['.cs'];
      default: return [];
    }
  }

  /**
   * Comprehensive language detection combining build files and file extensions
   */
  async detectLanguages(projectPath: string): Promise<{
    languages: Language[];
    primaryLanguage?: Language;
    buildFileLanguages: Language[];
    extensionLanguages: Language[];
  }> {
    const buildFileLanguages = await this.detectFromBuildFiles(projectPath);
    const extensionLanguages = await this.detectFromFileExtensions(projectPath);

    // Combine and deduplicate languages
    const allLanguages = [...new Set([...buildFileLanguages, ...extensionLanguages])];

    // Determine primary language
    const primaryLanguage = await this.detectPrimaryLanguage(allLanguages, projectPath);

    return {
      languages: allLanguages,
      primaryLanguage,
      buildFileLanguages,
      extensionLanguages
    };
  }

  /**
   * Validate that detected languages are supported
   */
  validateLanguages(languages: Language[]): {
    supported: Language[];
    unsupported: Language[];
    warnings: string[];
  } {
    const supportedLanguages: Language[] = ['typescript', 'javascript', 'java', 'python'];
    const supported: Language[] = [];
    const unsupported: Language[] = [];
    const warnings: string[] = [];

    for (const lang of languages) {
      if (supportedLanguages.includes(lang)) {
        supported.push(lang);
      } else {
        unsupported.push(lang);
        warnings.push(`⚠️ ${lang} is detected but not yet fully supported for parsing`);
      }
    }

    if (supported.length === 0 && unsupported.length > 0) {
      warnings.push('❌ No supported languages detected in project');
    }

    return { supported, unsupported, warnings };
  }

  /**
   * Get recommended scan configuration based on detected languages
   */
  async getRecommendedScanConfig(projectPath: string): Promise<{
    languages: Language[];
    primaryLanguage?: Language;
    buildSystems: string[];
    frameworks: string[];
    suggestions: string[];
    includeTests: boolean;
    excludePaths: string[];
  }> {
    const detection = await this.detectLanguages(projectPath);
    const validation = this.validateLanguages(detection.languages);
    const buildFileResult = await this.buildFileDetector.detect(projectPath);

    const suggestions: string[] = [];
    const buildSystems: string[] = [];
    const frameworks: string[] = [];
    const excludePaths = ['node_modules', 'dist', 'build', '.git', 'target', 'coverage'];

    // Extract build systems and frameworks
    for (const metadata of buildFileResult.projectMetadata) {
      if (metadata.buildSystem && !buildSystems.includes(metadata.buildSystem)) {
        buildSystems.push(metadata.buildSystem);
      }
      if (metadata.framework && !frameworks.includes(metadata.framework)) {
        frameworks.push(metadata.framework);
      }
    }

    // Add language-specific exclude paths
    if (detection.languages.includes('java')) {
      excludePaths.push('target/**', '*.class');
    }
    if (detection.languages.includes('python')) {
      excludePaths.push('__pycache__/**', '*.pyc', 'venv/**', '.venv/**');
    }
    if (detection.languages.includes('csharp')) {
      excludePaths.push('bin/**', 'obj/**');
    }

    // Generate suggestions
    suggestions.push(...validation.warnings);
    suggestions.push(...buildFileResult.suggestions);

    if (buildFileResult.isMonoRepo) {
      suggestions.push('🏗️ Mono-repository structure detected - consider scanning sub-projects separately');
    }

    if (frameworks.length > 0) {
      suggestions.push(`🚀 Frameworks detected: ${frameworks.join(', ')}`);
    }

    return {
      languages: validation.supported,
      primaryLanguage: detection.primaryLanguage,
      buildSystems,
      frameworks,
      suggestions,
      includeTests: true,
      excludePaths
    };
  }
}