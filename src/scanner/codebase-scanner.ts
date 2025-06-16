import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { Neo4jClient } from '../graph/neo4j-client.js';
import { NodeManager } from '../graph/node-manager.js';
import { EdgeManager } from '../graph/edge-manager.js';
import { EmbeddingService } from '../services/embedding-service.js';
import { SemanticSearchManager } from '../services/semantic-search-manager.js';
import { TypeScriptParser } from './parsers/typescript-parser.js';
import { JavaParser } from './parsers/java-parser.js';
import { PythonParser } from './parsers/python-parser.js';
import { 
  ScanConfig, 
  ParseResult, 
  LanguageParser, 
  ParsedEntity, 
  ParsedRelationship,
  Language,
  ProjectDetectionResult 
} from './types.js';
import { ProjectLanguageDetector } from './detection/language-detector.js';
import { ProjectBuildFileDetector } from './detection/build-file-detector.js';
import { GitRepositoryManager, GitAuthConfig } from './git/index.js';

export class CodebaseScanner {
  private parsers: Map<Language, LanguageParser>;
  private nodeManager: NodeManager;
  private edgeManager: EdgeManager;
  private embeddingService: EmbeddingService;
  private semanticSearchManager: SemanticSearchManager;
  private languageDetector: ProjectLanguageDetector;
  private buildFileDetector: ProjectBuildFileDetector;
  private gitManager: GitRepositoryManager;

  constructor(private client: Neo4jClient) {
    this.nodeManager = new NodeManager(client);
    this.edgeManager = new EdgeManager(client);
    this.embeddingService = new EmbeddingService();
    this.semanticSearchManager = new SemanticSearchManager(client, this.embeddingService);
    this.languageDetector = new ProjectLanguageDetector();
    this.buildFileDetector = new ProjectBuildFileDetector();
    this.gitManager = new GitRepositoryManager();
    
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
    
    let actualProjectPath = config.projectPath;
    let isTemporaryPath = false;

    // Handle remote repository cloning
    if (config.isRemote && config.gitUrl) {
      console.log(`🔍 Starting remote codebase scan for project '${config.projectId}': ${config.gitUrl}`);
      
      try {
        actualProjectPath = await this.gitManager.cloneRepository(config.gitUrl, {
          branch: config.gitBranch,
          depth: 1, // Shallow clone for efficiency
          singleBranch: true,
          tempDir: config.tempDir,
          useCache: config.useCache,
          cacheOptions: config.cacheOptions,
          progressCallback: config.outputProgress ? (progress) => {
            console.log(`📊 ${progress.message} ${progress.percentage ? `(${Math.round(progress.percentage)}%)` : ''}`);
          } : undefined
        });
        isTemporaryPath = true;
        console.log(`📥 Repository cloned to: ${actualProjectPath}`);
      } catch (error) {
        throw new Error(`Failed to clone remote repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.log(`🔍 Starting local codebase scan for project '${config.projectId}': ${config.projectPath}`);
    }
    
    // Create updated config with actual path
    const actualConfig: ScanConfig = {
      ...config,
      projectPath: actualProjectPath
    };
    
    // Ensure project exists in database
    await this.ensureProjectExists(actualConfig);
    
    const allEntities: ParsedEntity[] = [];
    const allRelationships: ParsedRelationship[] = [];
    const allErrors: any[] = [];
    let filesProcessed = 0;

    try {
      // Find all source files
      const files = await this.findSourceFiles(actualConfig);
      console.log(`📁 Found ${files.length} source files`);

      // Process files in batches
      const batchSize = 10;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(file => this.processFile(file, actualConfig))
        );

        for (const result of batchResults) {
          if (result) {
            allEntities.push(...result.entities);
            allRelationships.push(...result.relationships);
            allErrors.push(...result.errors);
            filesProcessed++;
          }
        }

        if (actualConfig.outputProgress) {
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
    } finally {
      // Cleanup temporary directory for remote repositories
      if (isTemporaryPath && (config.cleanupTemp !== false)) {
        try {
          await this.gitManager.cleanup(actualProjectPath);
        } catch (cleanupError) {
          console.warn(`⚠️  Failed to cleanup temporary directory: ${cleanupError instanceof Error ? cleanupError.message : 'Unknown error'}`);
        }
      }
    }
  }

  async clearGraph(projectId?: string): Promise<void> {
    if (projectId) {
      console.log(`🗑️  Clearing graph data for project '${projectId}'...`);
      const query = `
        MATCH (n:CodeNode {project_id: $project_id})
        OPTIONAL MATCH (n)-[r {project_id: $project_id}]-()
        DELETE n, r
      `;
      await this.client.runQuery(query, { project_id: projectId });
      console.log(`✅ Project '${projectId}' graph data cleared`);
    } else {
      console.log(`🗑️  Clearing all graph data...`);
      const query = `
        MATCH (n)
        DETACH DELETE n
      `;
      await this.client.runQuery(query);
      console.log(`✅ All graph data cleared`);
    }
  }

  private async ensureProjectExists(config: ScanConfig): Promise<void> {
    try {
      // Check if project already exists
      const existingProject = await this.client.getProject(config.projectId);
      
      if (!existingProject) {
        // Create new project
        console.log(`📋 Creating project '${config.projectId}'...`);
        await this.client.createProject({
          project_id: config.projectId,
          name: config.projectName || config.projectId,
          description: `Scanned from ${config.projectPath}`
        });
        console.log(`✅ Project '${config.projectId}' created`);
      } else {
        console.log(`📋 Using existing project '${config.projectId}'`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to create/verify project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validateProjectStructure(projectPath: string): Promise<ProjectDetectionResult> {
    // Check if path exists
    if (!fs.existsSync(projectPath)) {
      return {
        isValid: false,
        suggestions: [`Project path does not exist: ${projectPath}`],
        detectedLanguages: [],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      };
    }

    try {
      // Use the new comprehensive detection system
      const result = await this.buildFileDetector.detect(projectPath);
      
      // If no build files found, fallback to file extension detection
      if (result.detectedLanguages.length === 0) {
        const extensionLanguages = await this.languageDetector.detectFromFileExtensions(projectPath);
        result.detectedLanguages = extensionLanguages;
        result.suggestions.push('💡 No build files detected - using file extension detection');
        
        if (extensionLanguages.length === 0) {
          result.suggestions.push('⚠️ No source files found - check project path and file extensions');
          result.isValid = false;
        } else {
          result.isValid = true;
        }
      }

      // Add recommendations for project structure
      const srcDirExists = fs.existsSync(path.join(projectPath, 'src'));
      if (!srcDirExists && result.detectedLanguages.length > 0) {
        result.suggestions.push('💡 Consider organizing code in a src/ directory for better analysis');
      }

      // Add language validation warnings
      const validation = this.languageDetector.validateLanguages(result.detectedLanguages);
      result.suggestions.push(...validation.warnings);

      return result;
    } catch (error) {
      return {
        isValid: false,
        suggestions: [`❌ Failed to analyze project structure: ${error instanceof Error ? error.message : String(error)}`],
        detectedLanguages: [],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      };
    }
  }

  /**
   * Get recommended scan configuration with auto-detected languages and metadata
   */
  async getRecommendedScanConfig(projectPath: string, projectId?: string): Promise<{
    scanConfig: Partial<ScanConfig>;
    projectMetadata: any[];
    suggestions: string[];
  }> {
    const detection = await this.validateProjectStructure(projectPath);
    const recommendation = await this.languageDetector.getRecommendedScanConfig(projectPath);

    const scanConfig: Partial<ScanConfig> = {
      projectPath,
      projectId: projectId || path.basename(projectPath),
      languages: recommendation.languages,
      excludePaths: recommendation.excludePaths,
      includeTests: recommendation.includeTests
    };

    // Extract project name from metadata if available
    const primaryMetadata = detection.projectMetadata.find(m => 
      m.language === recommendation.primaryLanguage
    ) || detection.projectMetadata[0];

    if (primaryMetadata?.name) {
      scanConfig.projectName = primaryMetadata.name;
    }

    return {
      scanConfig,
      projectMetadata: detection.projectMetadata,
      suggestions: [...detection.suggestions, ...recommendation.suggestions]
    };
  }

  private async findSourceFiles(config: ScanConfig): Promise<string[]> {
    const patterns = this.getFilePatterns(config.languages, config.includeTests);
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

  private getFilePatterns(languages: Language[], includeTests: boolean = false): string[] {
    const patterns: string[] = [];
    
    if (languages.includes('typescript')) {
      patterns.push('**/*.ts', '**/*.tsx');
    }
    if (languages.includes('javascript')) {
      patterns.push('**/*.js', '**/*.jsx');
    }
    if (languages.includes('java')) {
      // For Java, only include files from standard Maven/Gradle directory structure
      patterns.push('src/main/**/*.java');
      if (includeTests) {
        patterns.push('src/test/**/*.java');
      }
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
      const result = await parser.parseFile(filePath, content, config.projectId);
      
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
    
    // Deduplicate entities by ID + project_id
    const entityMap = new Map<string, ParsedEntity>();
    for (const entity of entities) {
      const key = `${entity.project_id}:${entity.id}`;
      if (!entityMap.has(key)) {
        entityMap.set(key, entity);
      }
    }
    const deduplicatedEntities = Array.from(entityMap.values());
    
    console.log(`📥 Deduplicated ${entities.length} entities to ${deduplicatedEntities.length}`);
    
    // Debug: log entity type counts
    const entityTypeCounts = deduplicatedEntities.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`📋 Entity types:`, entityTypeCounts);
    
    // Store entities in batches
    const entityBatchSize = 100;
    for (let i = 0; i < deduplicatedEntities.length; i += entityBatchSize) {
      const batch = deduplicatedEntities.slice(i, i + entityBatchSize);
      await Promise.all(batch.map(async (entity) => {
        try {
          await this.nodeManager.addNode({
            id: entity.id,
            project_id: entity.project_id,
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
    
    // Debug: Check if relationship targets exist in entities
    const entityIds = new Set(deduplicatedEntities.map(e => e.id));
    const missingTargets = relationships.filter(r => !entityIds.has(r.source) || !entityIds.has(r.target));
    console.log(`📋 Missing relationship targets: ${missingTargets.length} out of ${relationships.length}`);
    
    if (missingTargets.length > 0) {
      console.log(`📋 Sample missing targets:`, missingTargets.slice(0, 3).map(r => `${r.source} -> ${r.target} (source exists: ${entityIds.has(r.source)}, target exists: ${entityIds.has(r.target)})`));
    }
    
    // Store relationships in batches
    const relationshipBatchSize = 100;
    for (let i = 0; i < relationships.length; i += relationshipBatchSize) {
      const batch = relationships.slice(i, i + relationshipBatchSize);
      await Promise.all(batch.map(async (relationship) => {
        try {
          await this.edgeManager.addEdge({
            id: relationship.id,
            project_id: relationship.project_id,
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

    // Generate embeddings if semantic search is enabled
    if (this.embeddingService.isEnabled()) {
      console.log(`🧠 Generating semantic embeddings for ${deduplicatedEntities.length} entities...`);
      try {
        const embeddingResult = await this.generateEmbeddingsForEntities(deduplicatedEntities);
        console.log(`✅ Generated embeddings for ${embeddingResult.successful} entities (${embeddingResult.failed} failed)`);
        
        if (embeddingResult.failed > 0) {
          errors.push({
            type: 'embedding_generation_error',
            message: `Failed to generate embeddings for ${embeddingResult.failed} entities`,
            severity: 'warning'
          });
        }
      } catch (error) {
        console.warn(`⚠️ Failed to generate embeddings: ${error instanceof Error ? error.message : String(error)}`);
        errors.push({
          type: 'embedding_generation_error',
          message: error instanceof Error ? error.message : String(error),
          severity: 'warning'
        });
      }
    } else {
      console.log(`🧠 Semantic search disabled, skipping embedding generation`);
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
${errors.slice(0, 10).map(e => `  • ${e.file_path}: ${e.message}`).join('\n')}
${errors.length > 10 ? `  ... and ${errors.length - 10} more` : ''}
` : '✅ No issues detected'}

`;

    return report;
  }

  private async generateEmbeddingsForEntities(entities: ParsedEntity[]): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    // Filter entities that would benefit from embeddings
    const relevantEntities = entities.filter(entity => 
      ['class', 'interface', 'method', 'function', 'enum'].includes(entity.type) &&
      (entity.description || entity.name || entity.qualified_name)
    );

    if (relevantEntities.length === 0) {
      return { successful: 0, failed: 0 };
    }

    // Process in batches to avoid overwhelming the API
    const batchSize = 50;
    for (let i = 0; i < relevantEntities.length; i += batchSize) {
      const batch = relevantEntities.slice(i, i + batchSize);
      
      try {
        // Extract semantic content for the batch
        const contents = batch.map(entity => this.embeddingService.extractSemanticContent(entity));
        
        // Generate embeddings
        const embeddings = await this.embeddingService.generateEmbeddings(contents);
        
        // Store embeddings
        for (let j = 0; j < batch.length; j++) {
          const entity = batch[j];
          const embedding = embeddings[j];
          
          if (embedding) {
            try {
              await this.semanticSearchManager.addEmbeddingToNode(
                entity.id, 
                entity.project_id, 
                embedding
              );
              successful++;
            } catch (error) {
              console.warn(`Failed to store embedding for entity ${entity.id}:`, error);
              failed++;
            }
          } else {
            failed++;
          }
        }
      } catch (error) {
        console.warn(`Failed to process embedding batch starting at index ${i}:`, error);
        failed += batch.length;
      }
    }

    return { successful, failed };
  }

  async scanRemoteRepository(
    gitUrl: string, 
    config: Omit<ScanConfig, 'projectPath' | 'isRemote' | 'gitUrl'>
  ): Promise<ParseResult> {
    const remoteConfig: ScanConfig = {
      ...config,
      projectPath: '', // Will be set by cloning
      isRemote: true,
      gitUrl,
      cleanupTemp: true
    };
    
    return this.scanProject(remoteConfig);
  }

  async validateRemoteRepository(gitUrl: string): Promise<boolean> {
    try {
      await this.gitManager.validateRepository(gitUrl);
      return true;
    } catch {
      return false;
    }
  }

  isGitUrl(url: string): boolean {
    return this.gitManager.isGitUrl(url);
  }

  parseGitUrl(url: string) {
    return this.gitManager.parseGitUrl(url);
  }

  updateGitAuthConfig(authConfig: GitAuthConfig): void {
    this.gitManager.updateAuthConfig(authConfig);
  }

  async clearCache(): Promise<void> {
    await this.gitManager.clearCache();
  }

  async getCacheStats() {
    return this.gitManager.getCacheStats();
  }
}