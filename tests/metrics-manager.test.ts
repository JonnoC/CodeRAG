import { MetricsManager } from '../src/analysis/metrics-manager.js';
import { Neo4jClient } from '../src/graph/neo4j-client.js';

// Mock the Neo4jClient
jest.mock('../src/graph/neo4j-client.js');

describe('MetricsManager', () => {
  let metricsManager: MetricsManager;
  let mockClient: jest.Mocked<Neo4jClient>;

  beforeEach(() => {
    mockClient = {
      runQuery: jest.fn()
    } as any;

    metricsManager = new MetricsManager(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateCKMetrics', () => {
    test('should calculate all CK metrics for a class', async () => {
      // Mock class name query
      const mockRunQuery = mockClient.runQuery as jest.Mock;
      mockRunQuery
        .mockResolvedValueOnce({ records: [{ get: () => 'TestClass' }] }) // getClassName
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 10 }) }] }) // WMC
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 2 }) }] }) // DIT
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 3 }) }] }) // NOC
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 5 }) }] }) // CBO
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 15 }) }] }) // RFC
        .mockResolvedValueOnce({ records: [{ get: (key: string) => ({ toNumber: () => key === 'methods' ? 10 : 8 }) }] }); // LCOM

      const result = await metricsManager.calculateCKMetrics('test-class-id');

      expect(result).toEqual({
        classId: 'test-class-id',
        className: 'TestClass',
        wmc: 10,
        dit: 2,
        noc: 3,
        cbo: 5,
        rfc: 15,
        lcom: 2 // max(0, 10 - 8)
      });

      expect(mockClient.runQuery).toHaveBeenCalledTimes(7); // getClassName + 6 metrics
    });

    test('should handle zero values gracefully', async () => {
      // Mock all queries to return zero/null values
      const mockRunQuery = mockClient.runQuery as jest.Mock;
      mockRunQuery
        .mockResolvedValueOnce({ records: [{ get: () => 'EmptyClass' }] }) // getClassName
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 0 }) }] }) // WMC
        .mockResolvedValueOnce({ records: [{ get: () => null }] }) // DIT (no inheritance)
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 0 }) }] }) // NOC
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 0 }) }] }) // CBO
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 0 }) }] }) // RFC
        .mockResolvedValueOnce({ records: [{ get: (key: string) => ({ toNumber: () => 0 }) }] }); // LCOM

      const result = await metricsManager.calculateCKMetrics('empty-class-id');

      expect(result.wmc).toBe(0);
      expect(result.dit).toBe(0);
      expect(result.noc).toBe(0);
      expect(result.cbo).toBe(0);
      expect(result.rfc).toBe(0);
      expect(result.lcom).toBe(0);
    });
  });

  describe('calculatePackageMetrics', () => {
    test('should calculate package metrics correctly', async () => {
      // Mock CA, CE, and abstractness queries
      const mockRunQuery = mockClient.runQuery as jest.Mock;
      mockRunQuery
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 3 }) }] }) // CA
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 2 }) }] }) // CE
        .mockResolvedValueOnce({ 
          records: [{ 
            get: (key: string) => ({ toNumber: () => key === 'abstractClasses' ? 2 : 5 }) 
          }] 
        }); // Abstractness

      const result = await metricsManager.calculatePackageMetrics('com.example');

      expect(result.packageName).toBe('com.example');
      expect(result.ca).toBe(3);
      expect(result.ce).toBe(2);
      expect(result.instability).toBe(0.4);
      expect(result.abstractness).toBe(0.4);
      expect(result.distance).toBeCloseTo(0.2, 10);
    });

    test('should handle package with no coupling', async () => {
      const mockRunQuery = mockClient.runQuery as jest.Mock;
      mockRunQuery
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 0 }) }] }) // CA
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 0 }) }] }) // CE
        .mockResolvedValueOnce({ 
          records: [{ 
            get: (key: string) => ({ toNumber: () => 0 }) 
          }] 
        }); // Abstractness

      const result = await metricsManager.calculatePackageMetrics('isolated.package');

      expect(result.instability).toBe(0);
      expect(result.distance).toBe(1); // |0 + 0 - 1|
    });
  });

  describe('findArchitecturalIssues', () => {
    test('should find multiple types of architectural issues', async () => {
      // Mock circular dependencies
      const mockRunQuery = mockClient.runQuery as jest.Mock;
      mockRunQuery
        .mockResolvedValueOnce({ records: [{ get: () => 'com.example.circular' }] }) // Circular deps
        .mockResolvedValueOnce({ // God classes
          records: [{
            get: (key: string) => {
              switch(key) {
                case 'classId': return 'god-class-id';
                case 'className': return 'GodClass';
                case 'methodCount': return { toNumber: () => 25 };
                case 'coupling': return { toNumber: () => 15 };
                default: return null;
              }
            }
          }]
        })
        .mockResolvedValueOnce({ // High coupling
          records: [{
            get: (key: string) => {
              switch(key) {
                case 'classId': return 'coupled-class-id';
                case 'className': return 'CoupledClass';
                case 'coupling': return { toNumber: () => 30 };
                default: return null;
              }
            }
          }]
        });

      const issues = await metricsManager.findArchitecturalIssues();

      expect(issues).toHaveLength(3);
      
      const circularIssue = issues.find(i => i.type === 'circular_dependency');
      expect(circularIssue?.severity).toBe('high');
      expect(circularIssue?.entities).toContain('com.example.circular');

      const godClassIssue = issues.find(i => i.type === 'god_class');
      expect(godClassIssue?.severity).toBe('high');
      expect(godClassIssue?.metrics?.methodCount).toBe(25);

      const couplingIssue = issues.find(i => i.type === 'high_coupling');
      expect(couplingIssue?.severity).toBe('critical'); // > 25
      expect(couplingIssue?.metrics?.coupling).toBe(30);
    });

    test('should return empty array when no issues found', async () => {
      const mockRunQuery = mockClient.runQuery as jest.Mock;
      mockRunQuery
        .mockResolvedValueOnce({ records: [] }) // No circular deps
        .mockResolvedValueOnce({ records: [] }) // No god classes
        .mockResolvedValueOnce({ records: [] }); // No high coupling

      const issues = await metricsManager.findArchitecturalIssues();
      expect(issues).toHaveLength(0);
    });
  });

  describe('calculateProjectSummary', () => {
    test('should calculate comprehensive project summary', async () => {
      const mockRunQuery = mockClient.runQuery as jest.Mock;
      mockRunQuery
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 50 }) }] }) // Total classes
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 200 }) }] }) // Total methods
        .mockResolvedValueOnce({ records: [{ get: () => ({ toNumber: () => 10 }) }] }) // Total packages
        .mockResolvedValueOnce({ // Average metrics
          records: [{
            get: (key: string) => {
              switch(key) {
                case 'avgCBO': return 5.5;
                case 'avgRFC': return 12.3;
                case 'avgDIT': return 1.8;
                default: return 0;
              }
            }
          }]
        })
        .mockResolvedValueOnce({ records: [] }) // No circular deps
        .mockResolvedValueOnce({ records: [] }) // No god classes
        .mockResolvedValueOnce({ records: [] }); // No high coupling

      const summary = await metricsManager.calculateProjectSummary();

      expect(summary).toEqual({
        totalClasses: 50,
        totalMethods: 200,
        totalPackages: 10,
        averageMetrics: {
          avgCBO: 5.5,
          avgRFC: 12.3,
          avgDIT: 1.8
        },
        issueCount: 0
      });
    });
  });

  describe('helper methods', () => {
    test('should get class name', async () => {
      const mockRunQuery = mockClient.runQuery as jest.Mock;
      mockRunQuery.mockResolvedValueOnce({
        records: [{ get: () => 'TestClass' }]
      });

      const name = await (metricsManager as any).getClassName('test-id');
      expect(name).toBe('TestClass');
    });

    test('should return Unknown for missing class name', async () => {
      const mockRunQuery = mockClient.runQuery as jest.Mock;
      mockRunQuery.mockResolvedValueOnce({
        records: []
      });

      const name = await (metricsManager as any).getClassName('missing-id');
      expect(name).toBe('Unknown');
    });
  });
});