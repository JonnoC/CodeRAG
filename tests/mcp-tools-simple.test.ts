// Simple tests for MCP tools to boost coverage
import { addEdge, getEdge, deleteEdge, findEdgesBySource } from '../src/mcp/tools/edge-management.js';
import { findMethodCallers, findImplementations, findInheritanceHierarchy } from '../src/mcp/tools/relationship-analysis.js';
import { calculateCKMetrics, calculatePackageMetrics, findArchitecturalIssues, getProjectSummary } from '../src/mcp/tools/metrics-analysis.js';

// Mock the managers
const mockEdgeManager = {
  addEdge: jest.fn(),
  getEdge: jest.fn(),
  deleteEdge: jest.fn(),
  findEdgesBySource: jest.fn(),
  findClassesThatCallMethod: jest.fn(),
  findClassesThatImplementInterface: jest.fn(),
  findInheritanceHierarchy: jest.fn()
} as any;

const mockMetricsManager = {
  calculateCKMetrics: jest.fn(),
  calculatePackageMetrics: jest.fn(),
  findArchitecturalIssues: jest.fn(),
  calculateProjectSummary: jest.fn()
} as any;

describe('MCP Tools Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Edge Management Tools', () => {
    test('addEdge should handle success', async () => {
      const mockEdge = { id: 'edge1', project_id: 'test', type: 'calls', source: 'src', target: 'tgt' };
      mockEdgeManager.addEdge.mockResolvedValue(mockEdge);

      const result = await addEdge(mockEdgeManager, {
        id: 'edge1',
        project: 'test',
        type: 'calls',
        source: 'src',
        target: 'tgt'
      });

      expect(result.content[0].text).toContain('edge1');
    });

    test('getEdge should handle not found', async () => {
      mockEdgeManager.getEdge.mockResolvedValue(null);

      const result = await getEdge(mockEdgeManager, {
        id: 'missing',
        project: 'test'
      });

      expect(result.content[0].text).toContain('not found');
    });

    test('deleteEdge should handle success', async () => {
      mockEdgeManager.deleteEdge.mockResolvedValue(true);

      const result = await deleteEdge(mockEdgeManager, {
        id: 'edge1',
        project: 'test'
      });

      expect(result.content[0].text).toContain('deleted');
    });

    test('findEdgesBySource should handle empty results', async () => {
      mockEdgeManager.findEdgesBySource.mockResolvedValue([]);

      const result = await findEdgesBySource(mockEdgeManager, {
        project: 'test',
        source_id: 'source1'
      });

      expect(result.content[0].text).toContain('No edges found');
    });
  });

  describe('Relationship Analysis Tools', () => {
    test('findMethodCallers should handle results', async () => {
      mockEdgeManager.findClassesThatCallMethod.mockResolvedValue(['Class1', 'Class2']);

      const result = await findMethodCallers(mockEdgeManager, {
        project: 'test',
        method_name: 'testMethod'
      });

      expect(result.content[0].text).toContain('Class1');
    });

    test('findImplementations should handle empty results', async () => {
      mockEdgeManager.findClassesThatImplementInterface.mockResolvedValue([]);

      const result = await findImplementations(mockEdgeManager, {
        project: 'test',
        interface_name: 'TestInterface'
      });

      expect(result.content[0].text).toContain('No classes found');
    });

    test('findInheritanceHierarchy should handle results', async () => {
      mockEdgeManager.findInheritanceHierarchy.mockResolvedValue(['Child', 'Parent', 'GrandParent']);

      const result = await findInheritanceHierarchy(mockEdgeManager, {
        project: 'test',
        class_name: 'Child'
      });

      expect(result.content[0].text).toContain('Child');
    });
  });

  describe('Metrics Analysis Tools', () => {
    test('calculateCKMetrics should handle detailed results', async () => {
      const mockMetrics = {
        classId: 'class1',
        className: 'TestClass',
        wmc: 10,
        dit: 2,
        noc: 3,
        cbo: 5,
        rfc: 15,
        lcom: 2
      };
      mockMetricsManager.calculateCKMetrics.mockResolvedValue(mockMetrics);

      const result = await calculateCKMetrics(mockMetricsManager, {
        project: 'test',
        class_id: 'class1'
      }, 'detailed');

      expect(result.content[0].text).toContain('TestClass');
      expect(result.content[0].text).toContain('10');
    });

    test('calculateCKMetrics should handle simple results', async () => {
      const mockMetrics = {
        classId: 'class1',
        className: 'TestClass',
        wmc: 10,
        dit: 2,
        noc: 3,
        cbo: 5,
        rfc: 15,
        lcom: 2
      };
      mockMetricsManager.calculateCKMetrics.mockResolvedValue(mockMetrics);

      const result = await calculateCKMetrics(mockMetricsManager, {
        project: 'test',
        class_id: 'class1'
      }, 'simple');

      expect(result.content[0].text).toContain('TestClass');
      // Simple format should be more concise
      expect(result.content[0].text.length).toBeLessThan(250);
    });

    test('calculatePackageMetrics should handle results', async () => {
      const mockMetrics = {
        packageName: 'com.example',
        ca: 3,
        ce: 2,
        instability: 0.4,
        abstractness: 0.3,
        distance: 0.3
      };
      mockMetricsManager.calculatePackageMetrics.mockResolvedValue(mockMetrics);

      const result = await calculatePackageMetrics(mockMetricsManager, {
        project: 'test',
        package_name: 'com.example'
      }, 'detailed');

      expect(result.content[0].text).toContain('com.example');
    });

    test('findArchitecturalIssues should handle results', async () => {
      const mockIssues = [
        {
          type: 'god_class' as const,
          severity: 'high' as const,
          description: 'Large class detected',
          entities: ['BigClass']
        }
      ];
      mockMetricsManager.findArchitecturalIssues.mockResolvedValue(mockIssues);

      const result = await findArchitecturalIssues(mockMetricsManager);

      expect(result.content[0].text).toContain('god_class');
    });

    test('getProjectSummary should handle results', async () => {
      const mockSummary = {
        totalClasses: 50,
        totalMethods: 200,
        totalPackages: 10,
        averageMetrics: {
          avgCBO: 5.5,
          avgRFC: 12.3,
          avgDIT: 1.8
        },
        issueCount: 2
      };
      mockMetricsManager.calculateProjectSummary.mockResolvedValue(mockSummary);

      const result = await getProjectSummary(mockMetricsManager, {
        project: 'test'
      }, 'simple');

      expect(result.content[0].text).toContain('50 classes');
    });
  });
});