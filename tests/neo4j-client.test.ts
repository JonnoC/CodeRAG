// Mock the entire neo4j-driver module
const mockDriver = {
  verifyConnectivity: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  session: jest.fn()
};

const mockSession = {
  run: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
  executeWrite: jest.fn().mockImplementation((work) => work({}))
};

const mockResult = {
  records: []
};

const mockNeo4j = {
  driver: jest.fn().mockReturnValue(mockDriver),
  auth: {
    basic: jest.fn().mockReturnValue({})
  }
};

jest.mock('neo4j-driver', () => ({
  __esModule: true,
  default: mockNeo4j
}));

import { Neo4jClient } from '../src/graph/neo4j-client.js';
import { ProjectContext } from '../src/types.js';

describe('Neo4jClient', () => {
  let client: Neo4jClient;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up default mock behaviors
    mockDriver.session.mockReturnValue(mockSession);
    mockSession.run.mockResolvedValue(mockResult);
    mockResult.records = [
      {
        get: jest.fn().mockReturnValue({ properties: { health: 1 } })
      }
    ];

    // Recreate client
    const config = { uri: 'bolt://localhost:7687', user: 'neo4j', password: 'test' };
    client = new Neo4jClient(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should create client with provided config', () => {
      const config = { uri: 'bolt://localhost:7687', user: 'neo4j', password: 'test' };
      const newClient = new Neo4jClient(config);
      expect(newClient).toBeInstanceOf(Neo4jClient);
    });

    test('should create client with default project config', () => {
      const config = { uri: 'bolt://localhost:7687', user: 'neo4j', password: 'test' };
      const newClient = new Neo4jClient(config);
      expect(newClient).toBeInstanceOf(Neo4jClient);
    });
  });

  describe('connect', () => {
    test('should connect successfully', async () => {
      await client.connect();
      expect(mockNeo4j.driver).toHaveBeenCalledWith('bolt://localhost:7687', {});
      expect(mockDriver.verifyConnectivity).toHaveBeenCalled();
    });

    test('should throw error on connection failure', async () => {
      mockDriver.verifyConnectivity.mockRejectedValueOnce(new Error('Connection failed'));
      await expect(client.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    test('should disconnect successfully', async () => {
      await client.connect();
      await client.disconnect();
      expect(mockDriver.close).toHaveBeenCalled();
    });

    test('should handle disconnect when not connected', async () => {
      await client.disconnect();
      expect(mockDriver.close).not.toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    test('should return session when connected', async () => {
      await client.connect();
      const session = client.getSession();
      expect(session).toBe(mockSession);
      expect(mockDriver.session).toHaveBeenCalled();
    });

    test('should throw error when not connected', () => {
      expect(() => client.getSession()).toThrow('Neo4J driver not connected. Call connect() first.');
    });
  });

  describe('runQuery', () => {
    test('should run query successfully', async () => {
      await client.connect();
      const result = await client.runQuery('RETURN 1', {});
      expect(mockSession.run).toHaveBeenCalledWith('RETURN 1', {});
      expect(mockSession.close).toHaveBeenCalled();
      expect(result).toBe(mockResult);
    });

    test('should close session after query', async () => {
      await client.connect();
      await client.runQuery('RETURN 1', {});
      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('runTransaction', () => {
    test('should run transaction successfully', async () => {
      await client.connect();
      const workFunction = jest.fn().mockResolvedValue('result');
      const result = await client.runTransaction(workFunction);
      
      expect(mockSession.executeWrite).toHaveBeenCalledWith(workFunction);
      expect(mockSession.close).toHaveBeenCalled();
      expect(result).toBe('result');
    });
  });

  describe('healthCheck', () => {
    test('should return true for healthy connection', async () => {
      await client.connect();
      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(true);
      expect(mockSession.run).toHaveBeenCalledWith('RETURN 1 as health', {});
    });

    test('should return false for unhealthy connection', async () => {
      await client.connect();
      mockSession.run.mockRejectedValueOnce(new Error('Query failed'));
      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('initializeDatabase', () => {
    test('should create constraints and indexes', async () => {
      await client.connect();
      await client.initializeDatabase();
      expect(mockSession.run).toHaveBeenCalledTimes(13); // Number of constraints + indexes
    });
  });

  describe('project management', () => {
    test('should create project successfully', async () => {
      await client.connect();
      const project: ProjectContext = {
        project_id: 'test-project',
        name: 'Test Project',
        description: 'A test project'
      };

      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            project_id: 'test-project',
            name: 'Test Project',
            description: 'A test project',
            created_at: { toStandardDate: () => new Date() },
            updated_at: { toStandardDate: () => new Date() }
          }
        })
      };

      mockResult.records = [mockRecord];
      
      const result = await client.createProject(project);
      expect(result.project_id).toBe('test-project');
      expect(result.name).toBe('Test Project');
    });

    test('should get project successfully', async () => {
      await client.connect();
      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            project_id: 'test-project',
            name: 'Test Project',
            description: 'A test project',
            created_at: { toStandardDate: () => new Date() },
            updated_at: { toStandardDate: () => new Date() }
          }
        })
      };

      mockResult.records = [mockRecord];
      
      const result = await client.getProject('test-project');
      expect(result).not.toBeNull();
      expect(result?.project_id).toBe('test-project');
    });

    test('should return null for non-existent project', async () => {
      await client.connect();
      mockResult.records = [];
      
      const result = await client.getProject('non-existent');
      expect(result).toBeNull();
    });

    test('should list projects successfully', async () => {
      await client.connect();
      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            project_id: 'test-project',
            name: 'Test Project',
            description: 'A test project',
            created_at: { toStandardDate: () => new Date() },
            updated_at: { toStandardDate: () => new Date() }
          }
        })
      };

      mockResult.records = [mockRecord];
      
      const projects = await client.listProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].project_id).toBe('test-project');
    });

    test('should delete project successfully', async () => {
      await client.connect();
      mockResult.records = [{ get: jest.fn().mockReturnValue(1) }];
      
      const deleted = await client.deleteProject('test-project');
      expect(deleted).toBe(true);
    });
  });

  describe('utility methods', () => {
    test('should generate project label', () => {
      const label = client.getProjectLabel('test-project', 'class');
      expect(label).toBe('Project_test-project_Class');
    });

    test('should generate project scoped ID', () => {
      const scopedId = client.generateProjectScopedId('test-project', 'entity-123');
      expect(scopedId).toBe('test-project:entity-123');
    });

    test('should parse project scoped ID', () => {
      const parsed = client.parseProjectScopedId('test-project:entity-123');
      expect(parsed.projectId).toBe('test-project');
      expect(parsed.entityId).toBe('entity-123');
    });

    test('should parse project scoped ID with colons in entity ID', () => {
      const parsed = client.parseProjectScopedId('test-project:namespace:class:method');
      expect(parsed.projectId).toBe('test-project');
      expect(parsed.entityId).toBe('namespace:class:method');
    });
  });
});