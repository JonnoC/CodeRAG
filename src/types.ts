export interface AnnotationInfo {
  name: string;                    // e.g., "@Override", "@Component", "@pytest.fixture"
  type: 'annotation' | 'decorator' | 'pragma';
  parameters?: Array<{
    name?: string;                 // Named parameter (e.g., "value" in @RequestMapping(value="/api"))
    value: string;                 // Parameter value
    type?: string;                 // Parameter type if determinable
  }>;
  source_line?: number;           // Line number where annotation appears
  framework?: string;             // e.g., "Spring", "JUnit", "Flask", "Angular"
  category?: string;              // e.g., "testing", "injection", "validation", "lifecycle"
}

export interface CodeNode {
  id: string;
  type: 'class' | 'interface' | 'enum' | 'exception' | 'function' | 'method' | 'field' | 'package' | 'module';
  name: string;
  qualified_name: string;
  description?: string;
  source_file?: string;
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
    annotations?: AnnotationInfo[];
    [key: string]: any;
  };
}

export interface CodeEdge {
  id: string;
  type: 'calls' | 'implements' | 'extends' | 'contains' | 'references' | 'throws' | 'belongs_to';
  source: string;
  target: string;
  attributes?: {
    [key: string]: any;
  };
}

export interface Neo4jConfig {
  uri: string;
  user: string;
  password: string;
}

export interface QueryResult {
  nodes?: CodeNode[];
  edges?: CodeEdge[];
  records?: any[];
}