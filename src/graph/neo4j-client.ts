import neo4j, { Driver, Session, Result } from 'neo4j-driver';
import { Neo4jConfig, ProjectConfig, ProjectContext } from '../types.js';

export class Neo4jClient {
  private driver: Driver | null = null;
  private projectConfig: ProjectConfig;

  constructor(private config: Neo4jConfig, projectConfig?: ProjectConfig) {
    this.projectConfig = projectConfig || {
      isolation_strategy: 'shared_db',
      cross_project_analysis: true,
      max_projects_shared_db: 100
    };
  }

  async connect(): Promise<void> {
    try {
      this.driver = neo4j.driver(
        this.config.uri,
        neo4j.auth.basic(this.config.user, this.config.password)
      );
      
      // Verify connectivity
      await this.driver.verifyConnectivity();
      console.log('Connected to Neo4J database');
    } catch (error) {
      console.error('Failed to connect to Neo4J:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      console.log('Disconnected from Neo4J database');
    }
  }

  getSession(): Session {
    if (!this.driver) {
      throw new Error('Neo4J driver not connected. Call connect() first.');
    }
    return this.driver.session();
  }

  async runQuery(query: string, parameters: Record<string, any> = {}): Promise<Result> {
    const session = this.getSession();
    try {
      return await session.run(query, parameters);
    } finally {
      await session.close();
    }
  }

  async runTransaction<T>(
    work: (tx: any) => Promise<T>
  ): Promise<T> {
    const session = this.getSession();
    try {
      return await session.executeWrite(work);
    } finally {
      await session.close();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.runQuery('RETURN 1 as health');
      return result.records.length > 0;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async initializeDatabase(): Promise<void> {
    const session = this.getSession();
    try {
      // Create project-aware constraints and indexes for better performance
      const constraints = [
        // Project-aware core constraints
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:CodeNode) REQUIRE (n.project_id, n.id) IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (e:CodeEdge) REQUIRE (e.project_id, e.id) IS UNIQUE',
        
        // Project context constraints
        'CREATE CONSTRAINT IF NOT EXISTS FOR (p:ProjectContext) REQUIRE p.project_id IS UNIQUE',
        
        // Project-aware indexes for performance
        'CREATE INDEX IF NOT EXISTS FOR (n:CodeNode) ON (n.project_id)',
        'CREATE INDEX IF NOT EXISTS FOR (n:CodeNode) ON (n.project_id, n.type)',
        'CREATE INDEX IF NOT EXISTS FOR (n:CodeNode) ON (n.project_id, n.name)',
        'CREATE INDEX IF NOT EXISTS FOR (n:CodeNode) ON (n.project_id, n.qualified_name)',
        'CREATE INDEX IF NOT EXISTS FOR (e:CodeEdge) ON (e.project_id)',
        'CREATE INDEX IF NOT EXISTS FOR (e:CodeEdge) ON (e.project_id, e.type)',
        
        // Traditional indexes for backward compatibility and cross-project queries
        'CREATE INDEX IF NOT EXISTS FOR (n:CodeNode) ON (n.type)',
        'CREATE INDEX IF NOT EXISTS FOR (n:CodeNode) ON (n.name)',
        'CREATE INDEX IF NOT EXISTS FOR (n:CodeNode) ON (n.qualified_name)',
        'CREATE INDEX IF NOT EXISTS FOR (e:CodeEdge) ON (e.type)'
      ];

      for (const constraint of constraints) {
        await session.run(constraint);
      }
      
      console.log('Database initialized with project-aware constraints and indexes');
    } finally {
      await session.close();
    }
  }

  // Project management methods
  async createProject(project: ProjectContext): Promise<ProjectContext> {
    const query = `
      CREATE (p:ProjectContext {
        project_id: $project_id,
        name: $name,
        description: $description,
        created_at: datetime(),
        updated_at: datetime()
      })
      RETURN p
    `;

    const params = {
      project_id: project.project_id,
      name: project.name || project.project_id,
      description: project.description || null
    };

    const result = await this.runQuery(query, params);
    if (result.records.length === 0) {
      throw new Error('Failed to create project');
    }

    const record = result.records[0].get('p');
    return {
      project_id: record.properties.project_id,
      name: record.properties.name,
      description: record.properties.description,
      created_at: record.properties.created_at.toStandardDate(),
      updated_at: record.properties.updated_at.toStandardDate()
    };
  }

  async getProject(projectId: string): Promise<ProjectContext | null> {
    const query = `
      MATCH (p:ProjectContext {project_id: $project_id})
      RETURN p
    `;

    const result = await this.runQuery(query, { project_id: projectId });
    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0].get('p');
    return {
      project_id: record.properties.project_id,
      name: record.properties.name,
      description: record.properties.description,
      created_at: record.properties.created_at?.toStandardDate(),
      updated_at: record.properties.updated_at?.toStandardDate()
    };
  }

  async listProjects(): Promise<ProjectContext[]> {
    const query = `
      MATCH (p:ProjectContext)
      RETURN p
      ORDER BY p.created_at DESC
    `;

    const result = await this.runQuery(query);
    return result.records.map(record => {
      const p = record.get('p');
      return {
        project_id: p.properties.project_id,
        name: p.properties.name,
        description: p.properties.description,
        created_at: p.properties.created_at?.toStandardDate(),
        updated_at: p.properties.updated_at?.toStandardDate()
      };
    });
  }

  async deleteProject(projectId: string): Promise<boolean> {
    const query = `
      MATCH (p:ProjectContext {project_id: $project_id})
      OPTIONAL MATCH (n:CodeNode {project_id: $project_id})
      OPTIONAL MATCH (e:CodeEdge {project_id: $project_id})
      DELETE p, n, e
      RETURN count(p) as deleted_projects
    `;

    const result = await this.runQuery(query, { project_id: projectId });
    return result.records[0]?.get('deleted_projects') > 0;
  }

  // Utility methods
  getProjectLabel(projectId: string, nodeType: string): string {
    return `Project_${projectId}_${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`;
  }

  generateProjectScopedId(projectId: string, entityId: string): string {
    return `${projectId}:${entityId}`;
  }

  parseProjectScopedId(scopedId: string): { projectId: string; entityId: string } {
    const [projectId, ...entityParts] = scopedId.split(':');
    return {
      projectId,
      entityId: entityParts.join(':')
    };
  }
}