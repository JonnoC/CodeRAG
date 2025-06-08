export interface ScanConfig {
  projectPath: string;
  projectId: string;
  projectName?: string;
  languages: Language[];
  excludePaths?: string[];
  includeTests?: boolean;
  maxDepth?: number;
  outputProgress?: boolean;
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
  file: string;
  line?: number;
  message: string;
  severity: 'warning' | 'error';
}

export interface LanguageParser {
  canParse(filePath: string): boolean;
  parseFile(filePath: string, content: string, projectId: string): Promise<{
    entities: ParsedEntity[];
    relationships: ParsedRelationship[];
    errors: ParseError[];
  }>;
}