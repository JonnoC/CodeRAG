import { NodeManager } from '../../graph/node-manager.js';
import { EdgeManager } from '../../graph/edge-manager.js';
import { CodebaseScanner } from '../../scanner/codebase-scanner.js';
import { ScanConfig, Language } from '../../scanner/types.js';

// Scanner Tool Parameters
export interface AddFileParams {
  file_path: string;
  project: string;
  clear_existing?: boolean;
}

export interface ScanDirParams {
  project: string;
  directory_path: string;
  languages?: Language[];
  exclude_paths?: string[];
  include_tests?: boolean;
  max_depth?: number;
  clear_existing?: boolean;
}

// Helper Functions
export function findParser(codebaseScanner: CodebaseScanner, filePath: string): any {
  const parsers = [
    codebaseScanner['parsers'].get('typescript'),
    codebaseScanner['parsers'].get('java'),
    codebaseScanner['parsers'].get('python')
  ];

  for (const parser of parsers) {
    if (parser && parser.canParse(filePath)) {
      return parser;
    }
  }
  return null;
}

export async function storeParseResult(
  parseResult: any, 
  project: string,
  nodeManager: NodeManager,
  edgeManager: EdgeManager
): Promise<void> {
  // Store entities - they already have project_id from the parsers
  for (const entity of parseResult.entities) {
    try {
      await nodeManager.addNode(entity);
    } catch (error) {
      // Skip duplicates
      if (!(error instanceof Error) || !error.message.includes('already exists')) {
        console.warn(`Failed to store entity ${entity.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  // Store relationships - they already have project_id from the parsers
  for (const relationship of parseResult.relationships) {
    try {
      await edgeManager.addEdge(relationship);
    } catch (error) {
      // Skip duplicates
      if (!(error instanceof Error) || !error.message.includes('already exists')) {
        console.warn(`Failed to store relationship ${relationship.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}

export function summarizeEntityTypes(entities: any[]): string {
  const typeCounts = entities.reduce((acc, entity) => {
    acc[entity.type] = (acc[entity.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(typeCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .map(([type, count]) => `  • ${type}: ${count}`)
    .join('\n') || '  No entities found';
}

// Scanner Tool Functions
export async function addFile(
  codebaseScanner: CodebaseScanner,
  nodeManager: NodeManager,
  edgeManager: EdgeManager,
  neo4jClient: any, // For clearing existing entities
  params: AddFileParams
) {
  try {
    const filePath = params.file_path;
    const clearExisting = params.clear_existing || false;

    // Check if file exists
    const fs = await import('fs');
    if (!fs.existsSync(filePath)) {
      return {
        content: [{ type: 'text', text: `❌ File not found: ${filePath}` }]
      };
    }

    // Clear existing entities from this file if requested
    if (clearExisting) {
      const query = `
        MATCH (n {source_file: $filePath, project: $project})
        DETACH DELETE n
      `;
      await neo4jClient.runQuery(query, { filePath, project: params.project });
    }

    // Read file content
    const content = await fs.promises.readFile(filePath, 'utf-8');

    // Find appropriate parser
    const parser = findParser(codebaseScanner, filePath);
    if (!parser) {
      const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.java', '.py'];
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Unsupported file type: ${filePath}\nSupported extensions: ${supportedExtensions.join(', ')}` 
        }]
      };
    }

    // Parse the file
    const parseResult = await parser.parseFile(filePath, content, params.project);

    // Store entities and relationships
    await storeParseResult(parseResult, params.project, nodeManager, edgeManager);

    const summary = `✅ File parsed successfully: ${filePath}

📊 Results:
  • Entities found: ${parseResult.entities.length}
  • Relationships found: ${parseResult.relationships.length}
  • Errors: ${parseResult.errors.length}

🏗️ Entity Types:
${summarizeEntityTypes(parseResult.entities)}

${parseResult.errors.length > 0 ? `
⚠️ Parse Errors:
${parseResult.errors.slice(0, 5).map((e: any) => `  • Line ${e.line || '?'}: ${e.message}`).join('\n')}
${parseResult.errors.length > 5 ? `  ... and ${parseResult.errors.length - 5} more` : ''}
` : ''}`;

    return {
      content: [{ type: 'text', text: summary }]
    };

  } catch (error) {
    return {
      content: [{ 
        type: 'text', 
        text: `❌ Failed to parse file: ${error instanceof Error ? error.message : String(error)}` 
      }]
    };
  }
}

export async function scanDir(
  codebaseScanner: CodebaseScanner,
  params: ScanDirParams
) {
  try {
    const directoryPath = params.directory_path;
    const languages = params.languages?.length ? params.languages : undefined;
    const excludePaths = params.exclude_paths || [];
    const includeTests = params.include_tests || false;
    const clearExisting = params.clear_existing || false;
    const maxDepth = params.max_depth || 10;

    // Check if directory exists
    const fs = await import('fs');
    if (!fs.existsSync(directoryPath)) {
      return {
        content: [{ type: 'text', text: `❌ Directory not found: ${directoryPath}` }]
      };
    }

    // Validate project structure first
    const validation = await codebaseScanner.validateProjectStructure(directoryPath);
    
    if (!validation.isValid) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Invalid project structure:\n${validation.suggestions.join('\n')}` 
        }]
      };
    }

    // Prepare scan configuration
    const scanConfig: ScanConfig = {
      projectPath: directoryPath,
      projectId: params.project,
      projectName: params.project,
      languages: languages || validation.detectedLanguages,
      excludePaths,
      includeTests,
      maxDepth,
      outputProgress: false // We'll handle our own progress reporting
    };

    // Clear existing project data if requested
    if (clearExisting) {
      await codebaseScanner.clearGraph(params.project);
    }

    // Perform the scan
    console.log(`🔍 Scanning directory: ${directoryPath}`);
    const scanResult = await codebaseScanner.scanProject(scanConfig);

    // Generate detailed report
    const report = await codebaseScanner.generateScanReport(scanResult);

    return {
      content: [{ type: 'text', text: report }]
    };

  } catch (error) {
    return {
      content: [{ 
        type: 'text', 
        text: `❌ Failed to scan directory: ${error instanceof Error ? error.message : String(error)}` 
      }]
    };
  }
}