import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { Neo4jClient } from '../graph/neo4j-client.js';
import { NodeManager } from '../graph/node-manager.js';
import { EdgeManager } from '../graph/edge-manager.js';
import { TypeScriptParser } from './parsers/typescript-parser.js';
import { JavaParser } from './parsers/java-parser.js';
import { PythonParser } from './parsers/python-parser.js';
import { 
  ScanConfig, 
  ParseResult, 
  LanguageParser, 
  ParsedEntity, 
  ParsedRelationship,
  Language 
} from './types.js';

export class CodebaseScanner {
  private parsers: Map<Language, LanguageParser>;
  private nodeManager: NodeManager;
  private edgeManager: EdgeManager;

  constructor(private client: Neo4jClient) {
    this.nodeManager = new NodeManager(client);
    this.edgeManager = new EdgeManager(client);
    
    // Initialize parsers
    this.parsers = new Map();
    const tsParser = new TypeScriptParser();
    this.parsers.set('typescript', tsParser);
    this.parsers.set('javascript', tsParser);
    this.parsers.set('java', new JavaParser());
    this.parsers.set('python', new PythonParser());
  }

  async scanProject(config: ScanConfig): Promise<ParseResult> {
    const startTime = Date.now();
    console.log(`🔍 Starting codebase scan: ${config.projectPath}`);
    
    const allEntities: ParsedEntity[] = [];
    const allRelationships: ParsedRelationship[] = [];
    const allErrors: any[] = [];
    let filesProcessed = 0;

    try {
      // Find all source files
      const files = await this.findSourceFiles(config);
      console.log(`📁 Found ${files.length} source files`);

      // Process files in batches
      const batchSize = 10;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(file => this.processFile(file, config))
        );

        for (const result of batchResults) {
          if (result) {
            allEntities.push(...result.entities);
            allRelationships.push(...result.relationships);
            allErrors.push(...result.errors);
            filesProcessed++;
          }
        }

        if (config.outputProgress) {
          console.log(`📊 Processed ${Math.min(i + batchSize, files.length)}/${files.length} files`);
        }
      }

      // Store entities and relationships in the graph
      console.log(`💾 Storing ${allEntities.length} entities and ${allRelationships.length} relationships...`);
      const storeErrors = await this.storeInGraph(allEntities, allRelationships);
      allErrors.push(...storeErrors);

      const processingTimeMs = Date.now() - startTime;
      
      const result: ParseResult = {
        entities: allEntities,
        relationships: allRelationships,
        errors: allErrors,
        stats: {
          filesProcessed,
          entitiesFound: allEntities.length,
          relationshipsFound: allRelationships.length,
          processingTimeMs
        }
      };

      console.log(`✅ Scan completed successfully!`);
      console.log(`   Files processed: ${filesProcessed}`);
      console.log(`   Entities found: ${allEntities.length}`);
      console.log(`   Relationships found: ${allRelationships.length}`);
      console.log(`   Processing time: ${(processingTimeMs / 1000).toFixed(2)}s`);
      
      if (allErrors.length > 0) {
        console.log(`⚠️  Warnings/Errors: ${allErrors.length}`);
      }

      return result;

    } catch (error) {
      console.error(`❌ Scan failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async clearGraph(): Promise<void> {
    console.log(`🗑️  Clearing existing graph data...`);
    const query = `
      MATCH (n)
      DETACH DELETE n
    `;
    await this.client.runQuery(query);
    console.log(`✅ Graph cleared`);
  }

  async validateProjectStructure(projectPath: string): Promise<{
    isValid: boolean;
    suggestions: string[];
    detectedLanguages: Language[];
  }> {
    const suggestions: string[] = [];
    const detectedLanguages: Language[] = [];

    // Check if path exists
    if (!fs.existsSync(projectPath)) {
      return {
        isValid: false,
        suggestions: [`Project path does not exist: ${projectPath}`],
        detectedLanguages: []
      };
    }

    // Detect languages by file extensions
    const files = await glob('**/*.{ts,tsx,js,jsx,java,py,cs}', { 
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
    });

    const extensions = new Set(files.map(f => path.extname(f).toLowerCase()));
    
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
      suggestions.push('C# parsing not yet implemented');
    }

    // Check for common project indicators
    const packageJsonExists = fs.existsSync(path.join(projectPath, 'package.json'));
    const tsconfigExists = fs.existsSync(path.join(projectPath, 'tsconfig.json'));
    const srcDirExists = fs.existsSync(path.join(projectPath, 'src'));

    if (packageJsonExists) {
      suggestions.push('✅ package.json found - Node.js project detected');
    }
    
    if (tsconfigExists) {
      suggestions.push('✅ tsconfig.json found - TypeScript project detected');
    }

    if (!srcDirExists && files.length > 0) {
      suggestions.push('💡 Consider organizing code in a src/ directory for better analysis');
    }

    if (files.length === 0) {
      suggestions.push('⚠️ No source files found - check project path and file extensions');
    }

    return {
      isValid: files.length > 0 && detectedLanguages.length > 0,
      suggestions,
      detectedLanguages
    };
  }

  private async findSourceFiles(config: ScanConfig): Promise<string[]> {
    const patterns = this.getFilePatterns(config.languages);
    const excludePatterns = [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.git/**',
      'coverage/**',
      '**/*.d.ts',
      ...(config.excludePaths || [])
    ];

    if (!config.includeTests) {
      excludePatterns.push('**/*.test.*', '**/*.spec.*', '**/test/**', '**/tests/**');
    }

    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: config.projectPath,
        ignore: excludePatterns,
        absolute: true
      });
      files.push(...matches);
    }

    // Remove duplicates and sort
    return [...new Set(files)].sort();
  }

  private getFilePatterns(languages: Language[]): string[] {
    const patterns: string[] = [];
    
    if (languages.includes('typescript')) {
      patterns.push('**/*.ts', '**/*.tsx');
    }
    if (languages.includes('javascript')) {
      patterns.push('**/*.js', '**/*.jsx');
    }
    if (languages.includes('java')) {
      patterns.push('**/*.java');
    }
    if (languages.includes('python')) {
      patterns.push('**/*.py');
    }
    if (languages.includes('csharp')) {
      patterns.push('**/*.cs');
    }

    return patterns;
  }

  private async processFile(filePath: string, config: ScanConfig): Promise<{
    entities: ParsedEntity[];
    relationships: ParsedRelationship[];
    errors: any[];
  } | null> {
    try {
      // Find appropriate parser
      const parser = this.findParser(filePath);
      if (!parser) {
        return null;
      }

      // Read file content
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      // Parse the file
      const result = await parser.parseFile(filePath, content);
      
      return result;

    } catch (error) {
      console.warn(`⚠️ Failed to process ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      return {
        entities: [],
        relationships: [],
        errors: [{
          file: filePath,
          message: error instanceof Error ? error.message : String(error),
          severity: 'error'
        }]
      };
    }
  }

  private findParser(filePath: string): LanguageParser | null {
    for (const parser of this.parsers.values()) {
      if (parser.canParse(filePath)) {
        return parser;
      }
    }
    return null;
  }

  private async storeInGraph(entities: ParsedEntity[], relationships: ParsedRelationship[]): Promise<any[]> {
    console.log(`📥 Storing entities...`);
    const errors: any[] = [];
    
    // Store entities in batches
    const entityBatchSize = 100;
    for (let i = 0; i < entities.length; i += entityBatchSize) {
      const batch = entities.slice(i, i + entityBatchSize);
      await Promise.all(batch.map(async (entity) => {
        try {
          await this.nodeManager.addNode({
            id: entity.id,
            type: entity.type as any,
            name: entity.name,
            qualified_name: entity.qualified_name,
            description: entity.description,
            source_file: entity.source_file,
            start_line: entity.start_line,
            end_line: entity.end_line,
            modifiers: entity.modifiers,
            attributes: entity.attributes
          });
        } catch (error) {
          // Skip duplicates or other node creation errors
          if (!(error instanceof Error) || !error.message.includes('already exists')) {
            console.warn(`Failed to store entity ${entity.id}: ${error instanceof Error ? error.message : String(error)}`);
            errors.push({
              type: 'node_creation_error',
              entity_id: entity.id,
              message: error instanceof Error ? error.message : String(error),
              severity: 'error'
            });
          }
        }
      }));
    }

    console.log(`🔗 Storing relationships...`);
    
    // Store relationships in batches
    const relationshipBatchSize = 100;
    for (let i = 0; i < relationships.length; i += relationshipBatchSize) {
      const batch = relationships.slice(i, i + relationshipBatchSize);
      await Promise.all(batch.map(async (relationship) => {
        try {
          await this.edgeManager.addEdge({
            id: relationship.id,
            type: relationship.type as any,
            source: relationship.source,
            target: relationship.target,
            attributes: relationship.attributes
          });
        } catch (error) {
          // Skip duplicates or other relationship creation errors
          if (!(error instanceof Error) || !error.message.includes('already exists')) {
            console.warn(`Failed to store relationship ${relationship.id}: ${error instanceof Error ? error.message : String(error)}`);
            errors.push({
              type: 'edge_creation_error',
              relationship_id: relationship.id,
              source: relationship.source,
              target: relationship.target,
              message: error instanceof Error ? error.message : String(error),
              severity: 'error'
            });
          }
        }
      }));
    }
    
    return errors;
  }

  async generateScanReport(result: ParseResult): Promise<string> {
    const { stats, entities, relationships, errors } = result;
    
    // Analyze entities by type
    const entityTypes = entities.reduce((acc, entity) => {
      acc[entity.type] = (acc[entity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Analyze relationships by type
    const relationshipTypes = relationships.reduce((acc, rel) => {
      acc[rel.type] = (acc[rel.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find largest classes (by method count)
    const classMethodCounts = relationships
      .filter(r => r.type === 'contains' && entities.find(e => e.id === r.target)?.type === 'method')
      .reduce((acc, r) => {
        acc[r.source] = (acc[r.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topClasses = Object.entries(classMethodCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([classId, count]) => {
        const entity = entities.find(e => e.id === classId);
        return `  • ${entity?.name || classId}: ${count} methods`;
      });

    const report = `
📊 CODEBASE SCAN REPORT
═══════════════════════

📈 STATISTICS
  Files processed: ${stats.filesProcessed}
  Entities found: ${stats.entitiesFound}
  Relationships found: ${stats.relationshipsFound}
  Processing time: ${(stats.processingTimeMs / 1000).toFixed(2)}s
  ${errors.length > 0 ? `Errors/Warnings: ${errors.length}` : ''}

🏗️ ENTITY BREAKDOWN
${Object.entries(entityTypes)
  .sort(([,a], [,b]) => b - a)
  .map(([type, count]) => `  • ${type}: ${count}`)
  .join('\n')}

🔗 RELATIONSHIP BREAKDOWN
${Object.entries(relationshipTypes)
  .sort(([,a], [,b]) => b - a)
  .map(([type, count]) => `  • ${type}: ${count}`)
  .join('\n')}

🏆 LARGEST CLASSES (by method count)
${topClasses.join('\n') || '  No classes found'}

${errors.length > 0 ? `
⚠️ ISSUES DETECTED
${errors.slice(0, 10).map(e => `  • ${e.file}: ${e.message}`).join('\n')}
${errors.length > 10 ? `  ... and ${errors.length - 10} more` : ''}
` : '✅ No issues detected'}

`;

    return report;
  }
}