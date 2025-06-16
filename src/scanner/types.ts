export interface ScanConfig {
  projectPath: string;
  projectId: string;
  projectName?: string;
  languages: Language[];
  excludePaths?: string[];
  includeTests?: boolean;
  maxDepth?: number;
  outputProgress?: boolean;
  // Remote repository support
  isRemote?: boolean;
  gitUrl?: string;
  gitBranch?: string;
  tempDir?: string;
  cleanupTemp?: boolean;
  useCache?: boolean;
  cacheOptions?: {
    maxAge?: number;
    forceRefresh?: boolean;
  };
}

export type Language = 'typescript' | 'javascript' | 'java' | 'python' | 'csharp';

export interface ParsedEntity {
  id: string;
  project_id: string;
  type: 'class' | 'interface' | 'enum' | 'exception' | 'function' | 'method' | 'field' | 'package' | 'module';
  name: string;
  qualified_name: string;
  description?: string;
  source_file: string;
  start_line?: number;
  end_line?: number;
  modifiers?: string[];
  annotations?: any[];
  attributes?: {
    parameters?: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
    return_type?: string;
    implements?: string[];
    extends?: string;
    [key: string]: any;
  };
}

export interface ParsedRelationship {
  id: string;
  project_id: string;
  type: 'calls' | 'implements' | 'extends' | 'contains' | 'references' | 'throws' | 'belongs_to';
  source: string;
  target: string;
  source_file: string;
  attributes?: {
    [key: string]: any;
  };
}

export interface ParseResult {
  entities: ParsedEntity[];
  relationships: ParsedRelationship[];
  errors: ParseError[];
  stats: {
    filesProcessed: number;
    entitiesFound: number;
    relationshipsFound: number;
    processingTimeMs: number;
  };
}

export interface ParseError {
  project_id?: string;
  file_path: string;
  line?: number;
  message: string;
  severity?: 'warning' | 'error';
}

export interface LanguageParser {
  canParse(filePath: string): boolean;
  parseFile(filePath: string, content: string, projectId: string): Promise<{
    entities: ParsedEntity[];
    relationships: ParsedRelationship[];
    errors: ParseError[];
  }>;
}

// New interfaces for improved language detection and project metadata

export interface ProjectMetadata {
  name?: string;
  version?: string;
  description?: string;
  language: Language;
  buildSystem?: BuildSystem;
  dependencies?: string[];
  devDependencies?: string[];
  framework?: string;
  subProjects?: SubProject[];
  buildFilePath: string;
}

export interface SubProject {
  name: string;
  path: string;
  language: Language;
  buildSystem?: BuildSystem;
  metadata?: ProjectMetadata;
}

export interface ProjectDetectionResult {
  isValid: boolean;
  suggestions: string[];
  detectedLanguages: Language[];
  primaryLanguage?: Language;
  projectMetadata: ProjectMetadata[];
  subProjects: SubProject[];
  isMonoRepo: boolean;
}

export type BuildSystem = 
  | 'npm' | 'yarn' | 'pnpm'           // JavaScript/TypeScript
  | 'maven' | 'gradle' | 'ant'         // Java
  | 'pip' | 'poetry' | 'pipenv' | 'conda' // Python
  | 'dotnet' | 'msbuild' | 'nuget'     // C#
  | 'make' | 'cmake' | 'bazel';        // General

export interface BuildFileDetector {
  detect(projectPath: string): Promise<ProjectDetectionResult>;
  canDetect(filePath: string): boolean;
  extractMetadata(filePath: string): Promise<ProjectMetadata | null>;
}

export interface LanguageDetector {
  detectFromBuildFiles(projectPath: string): Promise<Language[]>;
  detectFromFileExtensions(projectPath: string): Promise<Language[]>;
  detectPrimaryLanguage(languages: Language[], projectPath: string): Promise<Language | undefined>;
}