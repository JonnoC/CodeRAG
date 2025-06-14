import { CodebaseScanner } from '../../src/scanner/codebase-scanner.js';
import { Neo4jClient } from '../../src/graph/neo4j-client.js';
import { NodeManager } from '../../src/graph/node-manager.js';
import { EdgeManager } from '../../src/graph/edge-manager.js';

// Mock dependencies
jest.mock('../../src/graph/neo4j-client.js');
jest.mock('../../src/graph/node-manager.js');
jest.mock('../../src/graph/edge-manager.js');

describe('CodebaseScanner', () => {
  let mockClient: jest.Mocked<Neo4jClient>;
  let mockNodeManager: jest.Mocked<NodeManager>;
  let mockEdgeManager: jest.Mocked<EdgeManager>;
  let scanner: CodebaseScanner;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockClient = {
      runQuery: jest.fn().mockResolvedValue({ records: [] }),
      getProject: jest.fn(),
      createProject: jest.fn(),
    } as any;

    mockNodeManager = {
      addNode: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockEdgeManager = {
      addEdge: jest.fn().mockResolvedValue(undefined),
    } as any;

    (NodeManager as jest.MockedClass<typeof NodeManager>).mockImplementation(() => mockNodeManager);
    (EdgeManager as jest.MockedClass<typeof EdgeManager>).mockImplementation(() => mockEdgeManager);

    scanner = new CodebaseScanner(mockClient);
  });

  describe('Constructor', () => {
    test('should create scanner with parsers initialized', () => {
      expect(scanner).toBeInstanceOf(CodebaseScanner);
      expect(NodeManager).toHaveBeenCalledWith(mockClient);
      expect(EdgeManager).toHaveBeenCalledWith(mockClient);
    });
  });

  describe('clearGraph', () => {
    test('should clear project-specific data', async () => {
      await scanner.clearGraph('test-project');

      expect(mockClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (n:CodeNode {project_id: $project_id})'),
        { project_id: 'test-project' }
      );
    });

    test('should clear all data when no project specified', async () => {
      await scanner.clearGraph();

      expect(mockClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (n)')
      );
    });
  });

  describe('generateScanReport', () => {
    test('should generate comprehensive report', async () => {
      const mockResult = {
        entities: [
          {
            id: 'class1',
            type: 'class' as const,
            name: 'TestClass',
            qualified_name: 'TestClass',
            source_file: 'test.ts',
            project_id: 'test'
          },
          {
            id: 'method1',
            type: 'method' as const,
            name: 'testMethod',
            qualified_name: 'TestClass.testMethod',
            source_file: 'test.ts',
            project_id: 'test'
          }
        ],
        relationships: [
          {
            id: 'rel1',
            type: 'contains' as const,
            source: 'class1',
            target: 'method1',
            source_file: 'test.ts',
            project_id: 'test'
          }
        ],
        errors: [],
        stats: {
          filesProcessed: 1,
          entitiesFound: 2,
          relationshipsFound: 1,
          processingTimeMs: 1000
        }
      };

      const report = await scanner.generateScanReport(mockResult);

      expect(report).toContain('CODEBASE SCAN REPORT');
      expect(report).toContain('Files processed: 1');
      expect(report).toContain('Entities found: 2');
      expect(report).toContain('• class: 1');
      expect(report).toContain('• method: 1');
      expect(report).toContain('• contains: 1');
      expect(report).toContain('TestClass: 1 methods');
    });

    test('should handle empty results', async () => {
      const mockResult = {
        entities: [],
        relationships: [],
        errors: [],
        stats: {
          filesProcessed: 0,
          entitiesFound: 0,
          relationshipsFound: 0,
          processingTimeMs: 100
        }
      };

      const report = await scanner.generateScanReport(mockResult);

      expect(report).toContain('Files processed: 0');
      expect(report).toContain('No classes found');
    });
  });
});