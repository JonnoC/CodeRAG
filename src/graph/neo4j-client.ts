import neo4j, { Driver, Session, Result } from 'neo4j-driver';
import { Neo4jConfig } from '../types.js';

export class Neo4jClient {
  private driver: Driver | null = null;

  constructor(private config: Neo4jConfig) {}

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
      // Create constraints and indexes for better performance
      const constraints = [
        // Core constraints
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:CodeNode) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (e:CodeEdge) REQUIRE e.id IS UNIQUE',
        
        // Specific node type constraints
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Class) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Interface) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Method) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Function) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Field) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Module) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Package) REQUIRE n.id IS UNIQUE',
        'CREATE CONSTRAINT IF NOT EXISTS FOR (n:Enum) REQUIRE n.id IS UNIQUE',
        
        // Indexes for performance
        'CREATE INDEX IF NOT EXISTS FOR (n:CodeNode) ON (n.type)',
        'CREATE INDEX IF NOT EXISTS FOR (n:CodeNode) ON (n.name)',
        'CREATE INDEX IF NOT EXISTS FOR (n:CodeNode) ON (n.qualified_name)',
        'CREATE INDEX IF NOT EXISTS FOR (n:Class) ON (n.name)',
        'CREATE INDEX IF NOT EXISTS FOR (n:Interface) ON (n.name)',
        'CREATE INDEX IF NOT EXISTS FOR (n:Method) ON (n.name)',
        'CREATE INDEX IF NOT EXISTS FOR (n:Function) ON (n.name)',
        'CREATE INDEX IF NOT EXISTS FOR (e:CodeEdge) ON (e.type)'
      ];

      for (const constraint of constraints) {
        await session.run(constraint);
      }
      
      console.log('Database initialized with constraints and indexes');
    } finally {
      await session.close();
    }
  }
}