import { CodebaseScanner } from '../../src/scanner/codebase-scanner.js';
import { Neo4jClient } from '../../src/graph/neo4j-client.js';
import { ProjectLanguageDetector } from '../../src/scanner/detection/language-detector.js';
import { ProjectBuildFileDetector } from '../../src/scanner/detection/build-file-detector.js';
import * as fs from 'fs';

// Mock dependencies
jest.mock('../../src/graph/neo4j-client.js');
jest.mock('../../src/scanner/detection/language-detector.js');
jest.mock('../../src/scanner/detection/build-file-detector.js');
jest.mock('fs');
jest.mock('simple-git', () => ({
  simpleGit: jest.fn(() => ({
    clone: jest.fn(),
    listRemote: jest.fn()
  }))
}));

const MockNeo4jClient = Neo4jClient as jest.MockedClass<typeof Neo4jClient>;
const MockLanguageDetector = ProjectLanguageDetector as jest.MockedClass<typeof ProjectLanguageDetector>;
const MockBuildFileDetector = ProjectBuildFileDetector as jest.MockedClass<typeof ProjectBuildFileDetector>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('CodebaseScanner Enhanced Validation', () => {
  let scanner: CodebaseScanner;
  let mockClient: jest.Mocked<Neo4jClient>;
  let mockLanguageDetector: jest.Mocked<ProjectLanguageDetector>;
  let mockBuildFileDetector: jest.Mocked<ProjectBuildFileDetector>;

  beforeEach(() => {
    mockClient = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      runQuery: jest.fn(),
      initializeDatabase: jest.fn(),
      healthCheck: jest.fn()
    } as any;

    mockLanguageDetector = {
      detectFromBuildFiles: jest.fn(),
      detectFromFileExtensions: jest.fn(),
      detectPrimaryLanguage: jest.fn(),
      detectLanguages: jest.fn(),
      validateLanguages: jest.fn(),
      getRecommendedScanConfig: jest.fn()
    } as any;

    mockBuildFileDetector = {
      detect: jest.fn(),
      canDetect: jest.fn(),
      extractMetadata: jest.fn()
    } as any;

    MockNeo4jClient.mockImplementation(() => mockClient);
    MockLanguageDetector.mockImplementation(() => mockLanguageDetector);
    MockBuildFileDetector.mockImplementation(() => mockBuildFileDetector);

    scanner = new CodebaseScanner(mockClient);
    jest.clearAllMocks();
  });

  describe('validateProjectStructure', () => {
    it('should return error for non-existent path', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await scanner.validateProjectStructure('/nonexistent/path');

      expect(result.isValid).toBe(false);
      expect(result.suggestions).toContain('Project path does not exist: /nonexistent/path');
      expect(result.detectedLanguages).toEqual([]);
    });

    it('should use build file detection when successful', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: true,
        suggestions: ['✅ TypeScript project detected'],
        detectedLanguages: ['typescript'],
        primaryLanguage: 'typescript',
        projectMetadata: [{
          name: 'test-project',
          language: 'typescript',
          buildFilePath: '/test/package.json'
        }],
        subProjects: [],
        isMonoRepo: false
      });

      mockLanguageDetector.validateLanguages.mockReturnValue({
        supported: ['typescript'],
        unsupported: [],
        warnings: []
      });

      const result = await scanner.validateProjectStructure('/test/project');

      expect(result.isValid).toBe(true);
      expect(result.detectedLanguages).toEqual(['typescript']);
      expect(result.suggestions).toContain('✅ TypeScript project detected');
      expect(mockBuildFileDetector.detect).toHaveBeenCalledWith('/test/project');
    });

    it('should fallback to file extension detection when no build files', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: false,
        suggestions: [],
        detectedLanguages: [],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      });

      mockLanguageDetector.detectFromFileExtensions.mockResolvedValue(['java']);
      mockLanguageDetector.validateLanguages.mockReturnValue({
        supported: ['java'],
        unsupported: [],
        warnings: []
      });

      const result = await scanner.validateProjectStructure('/test/project');

      expect(result.isValid).toBe(true);
      expect(result.detectedLanguages).toEqual(['java']);
      expect(result.suggestions).toContain('💡 No build files detected - using file extension detection');
    });

    it('should handle completely empty projects', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: false,
        suggestions: [],
        detectedLanguages: [],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      });

      mockLanguageDetector.detectFromFileExtensions.mockResolvedValue([]);
      mockLanguageDetector.validateLanguages.mockReturnValue({
        supported: [],
        unsupported: [],
        warnings: []
      });

      const result = await scanner.validateProjectStructure('/test/project');

      expect(result.isValid).toBe(false);
      expect(result.detectedLanguages).toEqual([]);
      expect(result.suggestions).toContain('⚠️ No source files found - check project path and file extensions');
    });

    it('should add src directory suggestion when missing', async () => {
      mockFs.existsSync.mockImplementation((path: any) => {
        if (path.includes('src')) return false;
        return true;
      });

      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: true,
        suggestions: [],
        detectedLanguages: ['typescript'],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      });

      mockLanguageDetector.validateLanguages.mockReturnValue({
        supported: ['typescript'],
        unsupported: [],
        warnings: []
      });

      const result = await scanner.validateProjectStructure('/test/project');

      expect(result.suggestions).toContain('💡 Consider organizing code in a src/ directory for better analysis');
    });

    it('should include language validation warnings', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: true,
        suggestions: [],
        detectedLanguages: ['typescript', 'csharp'],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      });

      mockLanguageDetector.validateLanguages.mockReturnValue({
        supported: ['typescript'],
        unsupported: ['csharp'],
        warnings: ['⚠️ csharp is detected but not yet fully supported for parsing']
      });

      const result = await scanner.validateProjectStructure('/test/project');

      expect(result.suggestions).toContain('⚠️ csharp is detected but not yet fully supported for parsing');
    });

    it('should handle detection errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockBuildFileDetector.detect.mockRejectedValue(new Error('Detection failed'));

      const result = await scanner.validateProjectStructure('/test/project');

      expect(result.isValid).toBe(false);
      expect(result.suggestions).toContain('❌ Failed to analyze project structure: Detection failed');
    });
  });

  describe('getRecommendedScanConfig', () => {
    it('should provide comprehensive scan configuration', async () => {
      const mockDetection = {
        isValid: true,
        suggestions: ['✅ TypeScript project detected'],
        detectedLanguages: ['typescript'],
        primaryLanguage: 'typescript',
        projectMetadata: [{
          name: 'my-app',
          version: '1.0.0',
          language: 'typescript',
          buildFilePath: '/test/package.json'
        }],
        subProjects: [],
        isMonoRepo: false
      };

      const mockRecommendation = {
        languages: ['typescript'],
        primaryLanguage: 'typescript',
        buildSystems: ['npm'],
        frameworks: ['React'],
        suggestions: ['🚀 Framework: React'],
        includeTests: true,
        excludePaths: ['node_modules', 'dist', 'build']
      };

      // Mock the methods directly on the scanner instance
      jest.spyOn(scanner, 'validateProjectStructure').mockResolvedValue(mockDetection);
      mockLanguageDetector.getRecommendedScanConfig.mockResolvedValue(mockRecommendation);

      const result = await scanner.getRecommendedScanConfig('/test/project', 'test-project');

      expect(result.scanConfig.projectId).toBe('test-project');
      expect(result.scanConfig.projectName).toBe('my-app'); // From metadata
      expect(result.scanConfig.languages).toEqual(['typescript']);
      expect(result.scanConfig.excludePaths).toEqual(['node_modules', 'dist', 'build']);
      expect(result.scanConfig.includeTests).toBe(true);
      expect(result.projectMetadata).toEqual(mockDetection.projectMetadata);
      expect(result.suggestions).toEqual(expect.arrayContaining([
        '✅ TypeScript project detected',
        '🚀 Framework: React'
      ]));
    });

    it('should use project ID as name when no metadata available', async () => {
      const mockDetection = {
        isValid: true,
        suggestions: [],
        detectedLanguages: ['java'],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      };

      const mockRecommendation = {
        languages: ['java'],
        primaryLanguage: 'java',
        buildSystems: ['maven'],
        frameworks: [],
        suggestions: [],
        includeTests: true,
        excludePaths: ['target', 'build']
      };

      mockBuildFileDetector.detect.mockResolvedValue(mockDetection);
      mockLanguageDetector.getRecommendedScanConfig.mockResolvedValue(mockRecommendation);

      const result = await scanner.getRecommendedScanConfig('/test/project');

      expect(result.scanConfig.projectId).toBe('project'); // From path
      expect(result.scanConfig.projectName).toBeUndefined(); // No metadata
    });

    it('should prefer primary language metadata', async () => {
      const mockDetection = {
        isValid: true,
        suggestions: [],
        detectedLanguages: ['typescript', 'java'],
        primaryLanguage: 'typescript',
        projectMetadata: [
          {
            name: 'backend',
            language: 'java',
            buildFilePath: '/test/pom.xml'
          },
          {
            name: 'frontend',
            language: 'typescript',
            buildFilePath: '/test/package.json'
          }
        ],
        subProjects: [],
        isMonoRepo: true
      };

      const mockRecommendation = {
        languages: ['typescript', 'java'],
        primaryLanguage: 'typescript',
        buildSystems: ['npm', 'maven'],
        frameworks: [],
        suggestions: [],
        includeTests: true,
        excludePaths: ['node_modules', 'target']
      };

      jest.spyOn(scanner, 'validateProjectStructure').mockResolvedValue(mockDetection);
      mockLanguageDetector.getRecommendedScanConfig.mockResolvedValue(mockRecommendation);

      const result = await scanner.getRecommendedScanConfig('/test/project');

      expect(result.scanConfig.projectName).toBe('frontend'); // Primary language metadata
    });
  });
});