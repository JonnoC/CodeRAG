import { Neo4jClient } from '../src/graph/neo4j-client.js';
import { listProjects } from '../src/mcp/tools/list-projects.js';
import { ProjectContext } from '../src/types.js';

// Mock the Neo4jClient
jest.mock('../src/graph/neo4j-client.js');

describe('List Projects Tool', () => {
  let mockClient: jest.Mocked<Neo4jClient>;

  beforeEach(() => {
    mockClient = {
      listProjects: jest.fn(),
      runQuery: jest.fn()
    } as jest.Mocked<Neo4jClient>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listProjects', () => {
    test('should list projects without stats', async () => {
      const mockProjects: ProjectContext[] = [
        {
          project_id: 'project1',
          name: 'Project One',
          description: 'First project',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-02')
        },
        {
          project_id: 'project2',
          name: 'Project Two',
          description: 'Second project',
          created_at: new Date('2023-01-03'),
          updated_at: new Date('2023-01-04')
        }
      ];

      mockClient.listProjects.mockResolvedValue(mockProjects);

      const result = await listProjects(mockClient, { include_stats: false });

      expect(result.projects).toHaveLength(2);
      expect(result.total_count).toBe(2);
      expect(result.projects[0].name).toBe('Project One');
      expect(result.projects[1].name).toBe('Project Two');
      expect(result.projects[0]).not.toHaveProperty('stats');
    });

    test('should list projects with stats', async () => {
      const mockProjects: ProjectContext[] = [
        {
          project_id: 'project1',
          name: 'Project One',
          description: 'First project',
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-02')
        }
      ];

      mockClient.listProjects.mockResolvedValue(mockProjects);
      
      // Mock stats query - returns all stats in one record
      const mockRunQuery = mockClient.runQuery as jest.Mock;
      mockRunQuery.mockResolvedValue({
        records: [{
          get: (key: string) => {
            switch (key) {
              case 'entity_count':
                return { toNumber: () => 10 };
              case 'relationship_count':
                return { toNumber: () => 15 };
              case 'entity_types':
                return ['class', 'method', null];
              case 'relationship_types':
                return ['calls', 'implements', null];
              default:
                return null;
            }
          }
        }]
      });

      const result = await listProjects(mockClient, { include_stats: true });

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0]).toHaveProperty('stats');
      expect(result.projects[0].stats).toEqual({
        entity_count: 10,
        relationship_count: 15,
        entity_types: ['class', 'method'],
        relationship_types: ['calls', 'implements']
      });
      expect(result.summary).toBeDefined();
      expect(result.summary?.total_entities).toBe(10);
      expect(result.summary?.total_relationships).toBe(15);
    });

    test('should sort projects by name (default)', async () => {
      const mockProjects: ProjectContext[] = [
        {
          project_id: 'project2',
          name: 'Z Project',
          description: 'Last project',
          created_at: new Date('2023-01-01')
        },
        {
          project_id: 'project1',
          name: 'A Project',
          description: 'First project',
          created_at: new Date('2023-01-02')
        }
      ];

      mockClient.listProjects.mockResolvedValue(mockProjects);

      const result = await listProjects(mockClient, {});

      expect(result.projects[0].name).toBe('A Project');
      expect(result.projects[1].name).toBe('Z Project');
    });

    test('should sort projects by created_at', async () => {
      const mockProjects: ProjectContext[] = [
        {
          project_id: 'project1',
          name: 'New Project',
          created_at: new Date('2023-01-02')
        },
        {
          project_id: 'project2',
          name: 'Old Project',
          created_at: new Date('2023-01-01')
        }
      ];

      mockClient.listProjects.mockResolvedValue(mockProjects);

      const result = await listProjects(mockClient, { sort_by: 'created_at' });

      expect(result.projects[0].name).toBe('New Project');
      expect(result.projects[1].name).toBe('Old Project');
    });

    test('should limit results', async () => {
      const mockProjects: ProjectContext[] = [
        { project_id: 'project1', name: 'Project 1' },
        { project_id: 'project2', name: 'Project 2' },
        { project_id: 'project3', name: 'Project 3' }
      ];

      mockClient.listProjects.mockResolvedValue(mockProjects);

      const result = await listProjects(mockClient, { limit: 2 });

      expect(result.projects).toHaveLength(2);
      expect(result.total_count).toBe(3); // Total available, not limited
    });

    test('should sort projects with stats by entity_count', async () => {
      const mockProjects: ProjectContext[] = [
        { project_id: 'project1', name: 'Small Project' },
        { project_id: 'project2', name: 'Large Project' }
      ];

      mockClient.listProjects.mockResolvedValue(mockProjects);
      
      // Mock stats - project1 has fewer entities than project2
      const mockRunQuery = mockClient.runQuery as jest.Mock;
      mockRunQuery
        .mockResolvedValueOnce({ 
          records: [{ 
            get: (key: string) => {
              if (key === 'entity_count') return { toNumber: () => 5 };
              if (key === 'relationship_count') return { toNumber: () => 10 };
              if (key === 'entity_types') return ['class', 'method'];
              if (key === 'relationship_types') return ['calls', 'contains'];
              return null;
            }
          }] 
        }) // project1 stats
        .mockResolvedValueOnce({ 
          records: [{ 
            get: (key: string) => {
              if (key === 'entity_count') return { toNumber: () => 20 };
              if (key === 'relationship_count') return { toNumber: () => 30 };
              if (key === 'entity_types') return ['class', 'method', 'interface'];
              if (key === 'relationship_types') return ['calls', 'contains', 'implements'];
              return null;
            }
          }] 
        }); // project2 stats

      const result = await listProjects(mockClient, { include_stats: true, sort_by: 'entity_count' });

      expect(result.projects[0].name).toBe('Large Project'); // More entities first, sorted descending
      expect(result.projects[1].name).toBe('Small Project');
    });

    test('should handle empty project list', async () => {
      mockClient.listProjects.mockResolvedValue([]);

      const result = await listProjects(mockClient, {});

      expect(result.projects).toHaveLength(0);
      expect(result.total_count).toBe(0);
    });

    test('should handle errors gracefully', async () => {
      mockClient.listProjects.mockRejectedValue(new Error('Database connection failed'));

      await expect(listProjects(mockClient, {})).rejects.toThrow('Failed to list projects: Database connection failed');
    });

    test('should handle stats query errors gracefully', async () => {
      const mockProjects: ProjectContext[] = [
        { project_id: 'project1', name: 'Project One' }
      ];

      mockClient.listProjects.mockResolvedValue(mockProjects);
      (mockClient.runQuery as jest.Mock).mockRejectedValue(new Error('Stats query failed'));

      await expect(listProjects(mockClient, { include_stats: true })).rejects.toThrow('Failed to list projects: Stats query failed');
    });

    test('should use default parameters', async () => {
      const mockProjects: ProjectContext[] = [
        { project_id: 'project1', name: 'Project One' }
      ];

      mockClient.listProjects.mockResolvedValue(mockProjects);

      const result = await listProjects(mockClient);

      expect(result.projects).toHaveLength(1);
      expect(result.total_count).toBe(1);
      expect(result.projects[0]).not.toHaveProperty('stats'); // include_stats defaults to false
    });
  });

  describe('project statistics', () => {
    test('should calculate comprehensive project stats', async () => {
      const mockProjects: ProjectContext[] = [
        { project_id: 'project1', name: 'Test Project' }
      ];

      mockClient.listProjects.mockResolvedValue(mockProjects);
      
      // Mock detailed stats queries
      const mockRunQuery = mockClient.runQuery as jest.Mock;
      mockRunQuery.mockResolvedValueOnce({ 
        records: [{ 
          get: (key: string) => {
            if (key === 'entity_count') return { toNumber: () => 25 };
            if (key === 'relationship_count') return { toNumber: () => 40 };
            if (key === 'entity_types') return ['class', 'method', 'field'];
            if (key === 'relationship_types') return ['calls', 'implements', 'extends'];
            return null;
          }
        }] 
      });

      const result = await listProjects(mockClient, { include_stats: true });

      expect(result.projects[0].stats).toEqual({
        entity_count: 25,
        relationship_count: 40,
        entity_types: ['class', 'method', 'field'],
        relationship_types: ['calls', 'implements', 'extends']
      });
    });
  });
});