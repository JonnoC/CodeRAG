import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { 
  BuildFileDetector, 
  ProjectDetectionResult, 
  ProjectMetadata, 
  SubProject, 
  Language, 
  BuildSystem 
} from '../types.js';

export class ProjectBuildFileDetector implements BuildFileDetector {
  private buildFilePatterns = {
    // JavaScript/TypeScript
    'package.json': { language: 'typescript' as Language, buildSystem: 'npm' as BuildSystem },
    'yarn.lock': { language: 'typescript' as Language, buildSystem: 'yarn' as BuildSystem },
    'pnpm-lock.yaml': { language: 'typescript' as Language, buildSystem: 'pnpm' as BuildSystem },
    'tsconfig.json': { language: 'typescript' as Language },
    
    // Java
    'pom.xml': { language: 'java' as Language, buildSystem: 'maven' as BuildSystem },
    'build.gradle': { language: 'java' as Language, buildSystem: 'gradle' as BuildSystem },
    'build.gradle.kts': { language: 'java' as Language, buildSystem: 'gradle' as BuildSystem },
    'settings.gradle': { language: 'java' as Language, buildSystem: 'gradle' as BuildSystem },
    'gradle.properties': { language: 'java' as Language, buildSystem: 'gradle' as BuildSystem },
    'build.xml': { language: 'java' as Language, buildSystem: 'ant' as BuildSystem },
    
    // Python
    'setup.py': { language: 'python' as Language, buildSystem: 'pip' as BuildSystem },
    'pyproject.toml': { language: 'python' as Language, buildSystem: 'poetry' as BuildSystem },
    'requirements.txt': { language: 'python' as Language, buildSystem: 'pip' as BuildSystem },
    'Pipfile': { language: 'python' as Language, buildSystem: 'pipenv' as BuildSystem },
    'poetry.lock': { language: 'python' as Language, buildSystem: 'poetry' as BuildSystem },
    'environment.yml': { language: 'python' as Language, buildSystem: 'conda' as BuildSystem },
    'conda.yml': { language: 'python' as Language, buildSystem: 'conda' as BuildSystem },
    
    // C#
    '*.csproj': { language: 'csharp' as Language, buildSystem: 'dotnet' as BuildSystem },
    '*.sln': { language: 'csharp' as Language, buildSystem: 'dotnet' as BuildSystem },
    '*.fsproj': { language: 'csharp' as Language, buildSystem: 'dotnet' as BuildSystem },
    'packages.config': { language: 'csharp' as Language, buildSystem: 'nuget' as BuildSystem },
    
    // General
    'Makefile': { buildSystem: 'make' as BuildSystem },
    'CMakeLists.txt': { buildSystem: 'cmake' as BuildSystem },
    'BUILD': { buildSystem: 'bazel' as BuildSystem },
    'BUILD.bazel': { buildSystem: 'bazel' as BuildSystem }
  };

  async detect(projectPath: string): Promise<ProjectDetectionResult> {
    const suggestions: string[] = [];
    const detectedLanguages: Language[] = [];
    const projectMetadata: ProjectMetadata[] = [];
    const subProjects: SubProject[] = [];
    
    // Find all build files in the project
    const buildFiles = await this.findBuildFiles(projectPath);
    
    if (buildFiles.length === 0) {
      suggestions.push('⚠️ No build files found - this may not be a valid project');
      suggestions.push('💡 Consider adding appropriate build files (package.json, pom.xml, etc.)');
    }

    // Process each build file
    for (const buildFile of buildFiles) {
      try {
        const metadata = await this.extractMetadata(buildFile);
        if (metadata) {
          projectMetadata.push(metadata);
          if (!detectedLanguages.includes(metadata.language)) {
            detectedLanguages.push(metadata.language);
          }
          
          // Check if this is a sub-project
          if (path.dirname(buildFile) !== projectPath) {
            const subProjectPath = path.dirname(buildFile);
            const subProjectName = metadata.name || path.basename(subProjectPath);
            
            subProjects.push({
              name: subProjectName,
              path: subProjectPath,
              language: metadata.language,
              buildSystem: metadata.buildSystem,
              metadata
            });
          }
        }
      } catch (error) {
        suggestions.push(`⚠️ Failed to parse build file ${buildFile}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Determine if this is a mono-repo
    const isMonoRepo = subProjects.length > 1 || 
                      (subProjects.length === 1 && projectMetadata.length > 1);

    // Determine primary language
    const primaryLanguage = await this.determinePrimaryLanguage(detectedLanguages, projectPath);

    // Add language-specific suggestions
    this.addLanguageSpecificSuggestions(suggestions, detectedLanguages, projectMetadata, isMonoRepo);

    return {
      isValid: detectedLanguages.length > 0,
      suggestions,
      detectedLanguages,
      primaryLanguage,
      projectMetadata,
      subProjects,
      isMonoRepo
    };
  }

  canDetect(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return Object.keys(this.buildFilePatterns).some(pattern => {
      if (pattern.includes('*')) {
        // Handle glob patterns like *.csproj
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fileName);
      }
      return fileName === pattern;
    });
  }

  async extractMetadata(filePath: string): Promise<ProjectMetadata | null> {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileName = path.basename(filePath);
    const content = await fs.promises.readFile(filePath, 'utf-8');

    try {
      // Route to appropriate parser based on file type
      switch (fileName) {
        case 'package.json':
          return this.parsePackageJson(filePath, content);
        case 'pom.xml':
          return this.parsePomXml(filePath, content);
        case 'build.gradle':
        case 'build.gradle.kts':
          return this.parseBuildGradle(filePath, content);
        case 'setup.py':
          return this.parseSetupPy(filePath, content);
        case 'pyproject.toml':
          return this.parsePyprojectToml(filePath, content);
        default:
          if (fileName.endsWith('.csproj') || fileName.endsWith('.fsproj')) {
            return this.parseCsProj(filePath, content);
          }
          if (fileName.endsWith('.sln')) {
            return this.parseSolution(filePath, content);
          }
          return this.parseGenericBuildFile(filePath, fileName);
      }
    } catch (error) {
      console.warn(`Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private async findBuildFiles(projectPath: string): Promise<string[]> {
    const patterns = Object.keys(this.buildFilePatterns);
    const buildFiles: string[] = [];

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, {
          cwd: projectPath,
          absolute: true,
          ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**', 'target/**']
        });
        buildFiles.push(...files);
      } catch (error) {
        // Ignore glob errors for specific patterns
      }
    }

    return [...new Set(buildFiles)]; // Remove duplicates
  }

  private parsePackageJson(filePath: string, content: string): ProjectMetadata {
    const pkg = JSON.parse(content);
    const hasTypeScript = pkg.devDependencies?.typescript || 
                         pkg.dependencies?.typescript ||
                         fs.existsSync(path.join(path.dirname(filePath), 'tsconfig.json'));
    
    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      language: hasTypeScript ? 'typescript' : 'javascript',
      buildSystem: this.determineBuildSystem(path.dirname(filePath)),
      dependencies: pkg.dependencies ? Object.keys(pkg.dependencies) : [],
      devDependencies: pkg.devDependencies ? Object.keys(pkg.devDependencies) : [],
      framework: this.detectFramework(pkg),
      buildFilePath: filePath
    };
  }

  private parsePomXml(filePath: string, content: string): ProjectMetadata {
    // Basic XML parsing for Maven pom.xml
    const nameMatch = content.match(/<artifactId>(.*?)<\/artifactId>/);
    const versionMatch = content.match(/<version>(.*?)<\/version>/);
    const descMatch = content.match(/<description>(.*?)<\/description>/);
    
    return {
      name: nameMatch?.[1],
      version: versionMatch?.[1],
      description: descMatch?.[1],
      language: 'java',
      buildSystem: 'maven',
      buildFilePath: filePath
    };
  }

  private parseBuildGradle(filePath: string, content: string): ProjectMetadata {
    // Basic parsing for Gradle build files
    const nameMatch = content.match(/rootProject\.name\s*=\s*['"]([^'"]+)['"]/);
    const versionMatch = content.match(/version\s*=\s*['"]([^'"]+)['"]/);
    
    return {
      name: nameMatch?.[1] || path.basename(path.dirname(filePath)),
      version: versionMatch?.[1],
      language: 'java',
      buildSystem: 'gradle',
      buildFilePath: filePath
    };
  }

  private parseSetupPy(filePath: string, content: string): ProjectMetadata {
    // Basic parsing for Python setup.py
    const nameMatch = content.match(/name\s*=\s*['"]([^'"]+)['"]/);
    const versionMatch = content.match(/version\s*=\s*['"]([^'"]+)['"]/);
    const descMatch = content.match(/description\s*=\s*['"]([^'"]+)['"]/);
    
    return {
      name: nameMatch?.[1],
      version: versionMatch?.[1],
      description: descMatch?.[1],
      language: 'python',
      buildSystem: 'pip',
      buildFilePath: filePath
    };
  }

  private parsePyprojectToml(filePath: string, content: string): ProjectMetadata {
    // Basic TOML parsing for pyproject.toml
    const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
    const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
    const descMatch = content.match(/description\s*=\s*"([^"]+)"/);
    
    return {
      name: nameMatch?.[1],
      version: versionMatch?.[1],
      description: descMatch?.[1],
      language: 'python',
      buildSystem: 'poetry',
      buildFilePath: filePath
    };
  }

  private parseCsProj(filePath: string, content: string): ProjectMetadata {
    const nameMatch = content.match(/<AssemblyName>(.*?)<\/AssemblyName>/) ||
                     content.match(/<ProjectName>(.*?)<\/ProjectName>/);
    const versionMatch = content.match(/<Version>(.*?)<\/Version>/);
    
    return {
      name: nameMatch?.[1] || path.basename(filePath, path.extname(filePath)),
      version: versionMatch?.[1],
      language: 'csharp',
      buildSystem: 'dotnet',
      buildFilePath: filePath
    };
  }

  private parseSolution(filePath: string, content: string): ProjectMetadata {
    return {
      name: path.basename(filePath, '.sln'),
      language: 'csharp',
      buildSystem: 'dotnet',
      buildFilePath: filePath
    };
  }

  private parseGenericBuildFile(filePath: string, fileName: string): ProjectMetadata {
    const pattern = Object.keys(this.buildFilePatterns).find(p => 
      p.includes('*') ? new RegExp(p.replace(/\*/g, '.*')).test(fileName) : p === fileName
    );
    
    const config = pattern ? this.buildFilePatterns[pattern as keyof typeof this.buildFilePatterns] : null;
    
    let language: Language = 'typescript'; // default fallback
    let buildSystem: BuildSystem | undefined = undefined;
    
    if (config) {
      if ('language' in config) {
        language = config.language;
      }
      if ('buildSystem' in config) {
        buildSystem = config.buildSystem;
      }
    }
    
    return {
      name: path.basename(path.dirname(filePath)),
      language,
      buildSystem,
      buildFilePath: filePath
    };
  }

  private determineBuildSystem(projectPath: string): BuildSystem {
    if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) return 'yarn';
    if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
    return 'npm';
  }

  private detectFramework(pkg: any): string | undefined {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    if (allDeps.react) return 'React';
    if (allDeps.vue) return 'Vue';
    if (allDeps['@angular/core']) return 'Angular';
    if (allDeps.express) return 'Express';
    if (allDeps['@nestjs/core']) return 'NestJS';
    if (allDeps.next) return 'Next.js';
    
    return undefined;
  }

  private async determinePrimaryLanguage(languages: Language[], projectPath: string): Promise<Language | undefined> {
    if (languages.length === 0) return undefined;
    if (languages.length === 1) return languages[0];

    // Count files by language to determine primary
    const languageCounts: Record<Language, number> = {} as any;
    
    for (const lang of languages) {
      const extensions = this.getLanguageExtensions(lang);
      let count = 0;
      
      for (const ext of extensions) {
        const files = await glob(`**/*${ext}`, {
          cwd: projectPath,
          ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
        });
        count += files.length;
      }
      
      languageCounts[lang] = count;
    }

    // Return language with most files
    return Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as Language;
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

  private addLanguageSpecificSuggestions(
    suggestions: string[],
    languages: Language[],
    metadata: ProjectMetadata[],
    isMonoRepo: boolean
  ): void {
    if (isMonoRepo) {
      suggestions.push('🏗️ Mono-repository detected with multiple sub-projects');
    }

    for (const meta of metadata) {
      suggestions.push(`✅ ${meta.language} project detected: ${meta.name || 'unnamed'}`);
      
      if (meta.buildSystem) {
        suggestions.push(`🔧 Build system: ${meta.buildSystem}`);
      }
      
      if (meta.framework) {
        suggestions.push(`🚀 Framework: ${meta.framework}`);
      }
    }

    if (languages.length > 1) {
      suggestions.push(`🔀 Multi-language project detected: ${languages.join(', ')}`);
    }
  }
}