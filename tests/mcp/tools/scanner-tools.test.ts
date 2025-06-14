import { NodeManager } from '../../../src/graph/node-manager.js';
import { EdgeManager } from '../../../src/graph/edge-manager.js';
import { CodebaseScanner } from '../../../src/scanner/codebase-scanner.js';
import {
  addFile,
  scanDir,
  findParser,
  storeParseResult,
  summarizeEntityTypes
} from '../../../src/mcp/tools/scanner-tools.js';

// Mock the dependencies
jest.mock('../../../src/graph/node-manager.js');
jest.mock('../../../src/graph/edge-manager.js');
jest.mock('../../../src/scanner/codebase-scanner.js');
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  promises: {
    readFile: jest.fn()
  }
}));

describe('Scanner Tools', () => {
  let mockNodeManager: jest.Mocked<NodeManager>;
  let mockEdgeManager: jest.Mocked<EdgeManager>;
  let mockCodebaseScanner: jest.Mocked<CodebaseScanner>;
  let mockNeo4jClient: any;
  let mockFs: any;

  beforeEach(() => {
    mockNodeManager = {
      addNode: jest.fn()
    } as any;

    mockEdgeManager = {
      addEdge: jest.fn()
    } as any;

    mockCodebaseScanner = {
      parsers: new Map(),
      validateProjectStructure: jest.fn(),
      clearGraph: jest.fn(),
      scanProject: jest.fn(),
      generateScanReport: jest.fn()
    } as any;

    mockNeo4jClient = {
      runQuery: jest.fn()
    };

    mockFs = require('fs');

    // Setup default parser mock
    const mockTypescriptParser = {
      canParse: jest.fn(),
      parseFile: jest.fn()
    };
    const mockJavaParser = {
      canParse: jest.fn(),
      parseFile: jest.fn()
    };
    const mockPythonParser = {
      canParse: jest.fn(),
      parseFile: jest.fn()
    };
    
    mockCodebaseScanner.parsers.set('typescript', mockTypescriptParser);
    mockCodebaseScanner.parsers.set('java', mockJavaParser);
    mockCodebaseScanner.parsers.set('python', mockPythonParser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findParser', () => {
    test('should find typescript parser for .ts files', () => {
      const mockTypescriptParser = mockCodebaseScanner.parsers.get('typescript');
      const mockJavaParser = mockCodebaseScanner.parsers.get('java');
      const mockPythonParser = mockCodebaseScanner.parsers.get('python');
      
      mockTypescriptParser!.canParse.mockReturnValue(true);
      mockJavaParser!.canParse.mockReturnValue(false);
      mockPythonParser!.canParse.mockReturnValue(false);

      const result = findParser(mockCodebaseScanner, 'test.ts');

      expect(result).toBe(mockTypescriptParser);
      expect(mockTypescriptParser!.canParse).toHaveBeenCalledWith('test.ts');
    });

    test('should find java parser for .java files', () => {
      const mockTypescriptParser = mockCodebaseScanner.parsers.get('typescript');
      const mockJavaParser = mockCodebaseScanner.parsers.get('java');
      const mockPythonParser = mockCodebaseScanner.parsers.get('python');
      
      mockTypescriptParser!.canParse.mockReturnValue(false);
      mockJavaParser!.canParse.mockReturnValue(true);
      mockPythonParser!.canParse.mockReturnValue(false);

      const result = findParser(mockCodebaseScanner, 'Test.java');

      expect(result).toBe(mockJavaParser);
      expect(mockJavaParser!.canParse).toHaveBeenCalledWith('Test.java');
    });

    test('should return null when no parser can handle the file', () => {
      const mockTypescriptParser = mockCodebaseScanner.parsers.get('typescript');
      const mockJavaParser = mockCodebaseScanner.parsers.get('java');
      const mockPythonParser = mockCodebaseScanner.parsers.get('python');
      
      mockTypescriptParser!.canParse.mockReturnValue(false);
      mockJavaParser!.canParse.mockReturnValue(false);
      mockPythonParser!.canParse.mockReturnValue(false);

      const result = findParser(mockCodebaseScanner, 'test.txt');

      expect(result).toBeNull();
    });
  });

  describe('storeParseResult', () => {
    test('should store entities and relationships successfully', async () => {
      const parseResult = {
        entities: [
          { id: 'entity1', type: 'class', name: 'TestClass' },
          { id: 'entity2', type: 'method', name: 'testMethod' }
        ],
        relationships: [
          { id: 'rel1', type: 'contains', source: 'entity1', target: 'entity2' }
        ]
      };

      mockNodeManager.addNode.mockResolvedValue(undefined);
      mockEdgeManager.addEdge.mockResolvedValue(undefined);

      await storeParseResult(parseResult, 'test-project', mockNodeManager, mockEdgeManager);

      expect(mockNodeManager.addNode).toHaveBeenCalledTimes(2);
      expect(mockNodeManager.addNode).toHaveBeenCalledWith(parseResult.entities[0]);
      expect(mockNodeManager.addNode).toHaveBeenCalledWith(parseResult.entities[1]);
      expect(mockEdgeManager.addEdge).toHaveBeenCalledTimes(1);
      expect(mockEdgeManager.addEdge).toHaveBeenCalledWith(parseResult.relationships[0]);
    });

    test('should handle duplicate entity errors gracefully', async () => {
      const parseResult = {
        entities: [
          { id: 'entity1', type: 'class', name: 'TestClass' }
        ],
        relationships: []
      };

      mockNodeManager.addNode.mockRejectedValue(new Error('Entity already exists'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await storeParseResult(parseResult, 'test-project', mockNodeManager, mockEdgeManager);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should log non-duplicate errors', async () => {
      const parseResult = {
        entities: [
          { id: 'entity1', type: 'class', name: 'TestClass' }
        ],
        relationships: []
      };

      mockNodeManager.addNode.mockRejectedValue(new Error('Database connection failed'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await storeParseResult(parseResult, 'test-project', mockNodeManager, mockEdgeManager);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to store entity entity1: Database connection failed');
      consoleSpy.mockRestore();
    });
  });

  describe('summarizeEntityTypes', () => {
    test('should summarize entity types correctly', () => {
      const entities = [
        { type: 'class' },
        { type: 'method' },
        { type: 'method' },
        { type: 'class' },
        { type: 'field' },
        { type: 'method' }
      ];

      const result = summarizeEntityTypes(entities);

      expect(result).toBe('  • method: 3\n  • class: 2\n  • field: 1');
    });

    test('should handle empty entities array', () => {
      const result = summarizeEntityTypes([]);

      expect(result).toBe('  No entities found');
    });
  });

  describe('addFile', () => {
    test('should parse file successfully', async () => {
      const params = {
        file_path: '/test/file.ts',
        project: 'test-project'
      };

      const parseResult = {
        entities: [
          { id: 'class1', type: 'class', name: 'TestClass' }
        ],
        relationships: [],
        errors: []
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.promises.readFile.mockResolvedValue('const test = "hello";');
      
      const mockTypescriptParser = mockCodebaseScanner.parsers.get('typescript');
      const mockJavaParser = mockCodebaseScanner.parsers.get('java');
      const mockPythonParser = mockCodebaseScanner.parsers.get('python');
      
      mockTypescriptParser!.canParse.mockReturnValue(true);
      mockJavaParser!.canParse.mockReturnValue(false);
      mockPythonParser!.canParse.mockReturnValue(false);
      mockTypescriptParser!.parseFile.mockResolvedValue(parseResult);
      mockNodeManager.addNode.mockResolvedValue(undefined);

      const result = await addFile(
        mockCodebaseScanner,
        mockNodeManager,
        mockEdgeManager,
        mockNeo4jClient,
        params
      );

      expect(mockFs.existsSync).toHaveBeenCalledWith('/test/file.ts');
      expect(mockFs.promises.readFile).toHaveBeenCalledWith('/test/file.ts', 'utf-8');
      expect(mockTypescriptParser!.parseFile).toHaveBeenCalledWith('/test/file.ts', 'const test = "hello";', 'test-project');
      expect(result.content[0].text).toContain('✅ File parsed successfully');
      expect(result.content[0].text).toContain('Entities found: 1');
    });

    test('should handle non-existent file', async () => {
      const params = {
        file_path: '/nonexistent/file.ts',
        project: 'test-project'
      };

      mockFs.existsSync.mockReturnValue(false);

      const result = await addFile(
        mockCodebaseScanner,
        mockNodeManager,
        mockEdgeManager,
        mockNeo4jClient,
        params
      );

      expect(result.content[0].text).toBe('❌ File not found: /nonexistent/file.ts');
    });

    test('should handle unsupported file type', async () => {
      const params = {
        file_path: '/test/file.txt',
        project: 'test-project'
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.promises.readFile.mockResolvedValue('some content');
      
      // No parser can handle .txt files
      const mockTypescriptParser = mockCodebaseScanner.parsers.get('typescript');
      const mockJavaParser = mockCodebaseScanner.parsers.get('java');
      const mockPythonParser = mockCodebaseScanner.parsers.get('python');
      
      mockTypescriptParser!.canParse.mockReturnValue(false);
      mockJavaParser!.canParse.mockReturnValue(false);
      mockPythonParser!.canParse.mockReturnValue(false);

      const result = await addFile(
        mockCodebaseScanner,
        mockNodeManager,
        mockEdgeManager,
        mockNeo4jClient,
        params
      );

      expect(result.content[0].text).toContain('❌ Unsupported file type');
      expect(result.content[0].text).toContain('Supported extensions');
    });

    test('should clear existing entities when clear_existing is true', async () => {
      const params = {
        file_path: '/test/file.ts',
        project: 'test-project',
        clear_existing: true
      };

      const parseResult = {
        entities: [],
        relationships: [],
        errors: []
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.promises.readFile.mockResolvedValue('const test = "hello";');
      mockNeo4jClient.runQuery.mockResolvedValue({});
      
      const mockTypescriptParser = mockCodebaseScanner.parsers.get('typescript');
      const mockJavaParser = mockCodebaseScanner.parsers.get('java');
      const mockPythonParser = mockCodebaseScanner.parsers.get('python');
      
      mockTypescriptParser!.canParse.mockReturnValue(true);
      mockJavaParser!.canParse.mockReturnValue(false);
      mockPythonParser!.canParse.mockReturnValue(false);
      mockTypescriptParser!.parseFile.mockResolvedValue(parseResult);

      await addFile(
        mockCodebaseScanner,
        mockNodeManager,
        mockEdgeManager,
        mockNeo4jClient,
        params
      );

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('DETACH DELETE n'),
        { filePath: '/test/file.ts', project: 'test-project' }
      );
    });

    test('should handle parse errors in results', async () => {
      const params = {
        file_path: '/test/file.ts',
        project: 'test-project'
      };

      const parseResult = {
        entities: [],
        relationships: [],
        errors: [
          { line: 5, message: 'Syntax error' },
          { line: 10, message: 'Type error' }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.promises.readFile.mockResolvedValue('invalid typescript');
      
      const mockTypescriptParser = mockCodebaseScanner.parsers.get('typescript');
      const mockJavaParser = mockCodebaseScanner.parsers.get('java');
      const mockPythonParser = mockCodebaseScanner.parsers.get('python');
      
      mockTypescriptParser!.canParse.mockReturnValue(true);
      mockJavaParser!.canParse.mockReturnValue(false);
      mockPythonParser!.canParse.mockReturnValue(false);
      mockTypescriptParser!.parseFile.mockResolvedValue(parseResult);

      const result = await addFile(
        mockCodebaseScanner,
        mockNodeManager,
        mockEdgeManager,
        mockNeo4jClient,
        params
      );

      expect(result.content[0].text).toContain('⚠️ Parse Errors:');
      expect(result.content[0].text).toContain('Line 5: Syntax error');
      expect(result.content[0].text).toContain('Line 10: Type error');
    });

    test('should handle parsing exceptions', async () => {
      const params = {
        file_path: '/test/file.ts',
        project: 'test-project'
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.promises.readFile.mockResolvedValue('const test = "hello";');
      
      const mockTypescriptParser = mockCodebaseScanner.parsers.get('typescript');
      const mockJavaParser = mockCodebaseScanner.parsers.get('java');
      const mockPythonParser = mockCodebaseScanner.parsers.get('python');
      
      mockTypescriptParser!.canParse.mockReturnValue(true);
      mockJavaParser!.canParse.mockReturnValue(false);
      mockPythonParser!.canParse.mockReturnValue(false);
      mockTypescriptParser!.parseFile.mockRejectedValue(new Error('Parser crashed'));

      const result = await addFile(
        mockCodebaseScanner,
        mockNodeManager,
        mockEdgeManager,
        mockNeo4jClient,
        params
      );

      expect(result.content[0].text).toBe('❌ Failed to parse file: Parser crashed');
    });
  });

  describe('scanDir', () => {
    test('should scan directory successfully', async () => {
      const params = {
        project: 'test-project',
        directory_path: '/test/project'
      };

      const mockValidation = {
        isValid: true,
        detectedLanguages: ['typescript', 'java'] as any,
        suggestions: []
      };

      const mockScanResult = {
        totalFiles: 10,
        processedFiles: 8,
        entities: 25,
        relationships: 15
      };

      mockFs.existsSync.mockReturnValue(true);
      mockCodebaseScanner.validateProjectStructure.mockResolvedValue(mockValidation);
      mockCodebaseScanner.scanProject.mockResolvedValue(mockScanResult);
      mockCodebaseScanner.generateScanReport.mockResolvedValue('Scan completed successfully');

      const result = await scanDir(mockCodebaseScanner, params);

      expect(mockCodebaseScanner.validateProjectStructure).toHaveBeenCalledWith('/test/project');
      expect(mockCodebaseScanner.scanProject).toHaveBeenCalledWith({
        projectPath: '/test/project',
        projectId: 'test-project',
        projectName: 'test-project',
        languages: ['typescript', 'java'],
        excludePaths: [],
        includeTests: false,
        maxDepth: 10,
        outputProgress: false
      });
      expect(result.content[0].text).toBe('Scan completed successfully');
    });

    test('should handle non-existent directory', async () => {
      const params = {
        project: 'test-project',
        directory_path: '/nonexistent/project'
      };

      mockFs.existsSync.mockReturnValue(false);

      const result = await scanDir(mockCodebaseScanner, params);

      expect(result.content[0].text).toBe('❌ Directory not found: /nonexistent/project');
    });

    test('should handle invalid project structure', async () => {
      const params = {
        project: 'test-project',
        directory_path: '/test/invalid-project'
      };

      const mockValidation = {
        isValid: false,
        detectedLanguages: [],
        suggestions: ['No supported language files found', 'Try scanning a different directory']
      };

      mockFs.existsSync.mockReturnValue(true);
      mockCodebaseScanner.validateProjectStructure.mockResolvedValue(mockValidation);

      const result = await scanDir(mockCodebaseScanner, params);

      expect(result.content[0].text).toContain('❌ Invalid project structure:');
      expect(result.content[0].text).toContain('No supported language files found');
    });

    test('should use custom scan parameters', async () => {
      const params = {
        project: 'test-project',
        directory_path: '/test/project',
        languages: ['java'] as any,
        exclude_paths: ['node_modules', '*.test.ts'],
        include_tests: true,
        max_depth: 5,
        clear_existing: true
      };

      const mockValidation = {
        isValid: true,
        detectedLanguages: ['typescript', 'java'] as any,
        suggestions: []
      };

      mockFs.existsSync.mockReturnValue(true);
      mockCodebaseScanner.validateProjectStructure.mockResolvedValue(mockValidation);
      mockCodebaseScanner.clearGraph.mockResolvedValue(undefined);
      mockCodebaseScanner.scanProject.mockResolvedValue({});
      mockCodebaseScanner.generateScanReport.mockResolvedValue('Custom scan completed');

      await scanDir(mockCodebaseScanner, params);

      expect(mockCodebaseScanner.clearGraph).toHaveBeenCalledWith('test-project');
      expect(mockCodebaseScanner.scanProject).toHaveBeenCalledWith({
        projectPath: '/test/project',
        projectId: 'test-project',
        projectName: 'test-project',
        languages: ['java'],
        excludePaths: ['node_modules', '*.test.ts'],
        includeTests: true,
        maxDepth: 5,
        outputProgress: false
      });
    });

    test('should handle scanning exceptions', async () => {
      const params = {
        project: 'test-project',
        directory_path: '/test/project'
      };

      mockFs.existsSync.mockReturnValue(true);
      mockCodebaseScanner.validateProjectStructure.mockRejectedValue(new Error('Validation failed'));

      const result = await scanDir(mockCodebaseScanner, params);

      expect(result.content[0].text).toBe('❌ Failed to scan directory: Validation failed');
    });
  });
});