// Simple tests for core components to boost coverage
import { Neo4jClient } from '../src/graph/neo4j-client.js';
import { NodeManager } from '../src/graph/node-manager.js';
import { EdgeManager } from '../src/graph/edge-manager.js';

// Mock the dependencies
jest.mock('neo4j-driver');

describe('Simple Component Tests', () => {
  let mockClient: jest.Mocked<Neo4jClient>;

  beforeEach(() => {
    mockClient = {
      runQuery: jest.fn().mockResolvedValue({ records: [] }),
      getProjectLabel: jest.fn().mockReturnValue('Project_test_Class')
    } as any;
  });

  describe('NodeManager Simple Tests', () => {
    test('should handle empty search results', async () => {
      const nodeManager = new NodeManager(mockClient);
      
      const result = await nodeManager.findNodesByName('NonExistent', 'test-project');
      expect(result).toEqual([]);
      expect(mockClient.runQuery).toHaveBeenCalled();
    });

    test('should get node label for different types', () => {
      const nodeManager = new NodeManager(mockClient);
      
      // Test private method via reflection
      const getNodeLabel = (nodeManager as any).getNodeLabel;
      
      expect(getNodeLabel('class')).toBe('Class');
      expect(getNodeLabel('interface')).toBe('Interface');
      expect(getNodeLabel('enum')).toBe('Enum');
      expect(getNodeLabel('method')).toBe('Method');
      expect(getNodeLabel('function')).toBe('Function');
      expect(getNodeLabel('field')).toBe('Field');
      expect(getNodeLabel('module')).toBe('Module');
      expect(getNodeLabel('package')).toBe('Package');
      expect(getNodeLabel('unknown' as any)).toBe('CodeNode');
    });

    test('should ensure plain object conversion', () => {
      const nodeManager = new NodeManager(mockClient);
      const ensurePlainObject = (nodeManager as any).ensurePlainObject;
      
      expect(ensurePlainObject(null)).toBeNull();
      expect(ensurePlainObject(undefined)).toBeUndefined();
      expect(ensurePlainObject(['a', 'b'])).toEqual(['a', 'b']);
      expect(ensurePlainObject({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    });
  });

  describe('EdgeManager Simple Tests', () => {
    test('should handle empty edge queries', async () => {
      const edgeManager = new EdgeManager(mockClient);
      
      const result = await edgeManager.findEdgesByType('calls', 'test-project');
      expect(result).toEqual([]);
      expect(mockClient.runQuery).toHaveBeenCalled();
    });

    test('should handle inheritance hierarchy with no results', async () => {
      const edgeManager = new EdgeManager(mockClient);
      
      const result = await edgeManager.findInheritanceHierarchy('OrphanClass', 'test-project');
      expect(result).toEqual([]);
    });

    test('should ensure plain object conversion for edges', () => {
      const edgeManager = new EdgeManager(mockClient);
      const ensurePlainObject = (edgeManager as any).ensurePlainObject.bind(edgeManager);
      
      // Test Map conversion
      const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
      const result = ensurePlainObject(map);
      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    });
  });

  describe('Neo4jClient Simple Tests', () => {
    test('should generate project labels correctly', () => {
      const client = new Neo4jClient({ uri: 'bolt://localhost:7687', user: 'test', password: 'test' });
      
      expect(client.getProjectLabel('my-project', 'class')).toBe('Project_my-project_Class');
      expect(client.getProjectLabel('test_proj', 'method')).toBe('Project_test_proj_Method');
    });

    test('should generate and parse scoped IDs', () => {
      const client = new Neo4jClient({ uri: 'bolt://localhost:7687', user: 'test', password: 'test' });
      
      const scopedId = client.generateProjectScopedId('project1', 'entity123');
      expect(scopedId).toBe('project1:entity123');
      
      const parsed = client.parseProjectScopedId('project1:namespace:class:method');
      expect(parsed.projectId).toBe('project1');
      expect(parsed.entityId).toBe('namespace:class:method');
    });
  });
});