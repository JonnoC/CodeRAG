import { ProjectLanguageDetector } from '../../../src/scanner/detection/language-detector.js';
import { ProjectBuildFileDetector } from '../../../src/scanner/detection/build-file-detector.js';
import { glob } from 'glob';

// Mock dependencies
jest.mock('glob');
jest.mock('../../../src/scanner/detection/build-file-detector.js');

const mockGlob = glob as jest.MockedFunction<typeof glob>;
const MockBuildFileDetector = ProjectBuildFileDetector as jest.MockedClass<typeof ProjectBuildFileDetector>;

describe('ProjectLanguageDetector', () => {
  let detector: ProjectLanguageDetector;
  let mockBuildFileDetector: jest.Mocked<ProjectBuildFileDetector>;

  beforeEach(() => {
    mockBuildFileDetector = {
      detect: jest.fn(),
      canDetect: jest.fn(),
      extractMetadata: jest.fn()
    } as any;

    MockBuildFileDetector.mockImplementation(() => mockBuildFileDetector);
    detector = new ProjectLanguageDetector();
    jest.clearAllMocks();
  });

  describe('detectFromBuildFiles', () => {
    it('should detect languages from build files', async () => {
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: true,
        suggestions: [],
        detectedLanguages: ['typescript', 'java'],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      });

      const languages = await detector.detectFromBuildFiles('/test/project');

      expect(languages).toEqual(['typescript', 'java']);
      expect(mockBuildFileDetector.detect).toHaveBeenCalledWith('/test/project');
    });

    it('should return empty array on error', async () => {
      mockBuildFileDetector.detect.mockRejectedValue(new Error('Test error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const languages = await detector.detectFromBuildFiles('/test/project');

      expect(languages).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('detectFromFileExtensions', () => {
    it('should detect TypeScript files', async () => {
      mockGlob.mockResolvedValue(['src/app.ts', 'src/utils.tsx']);

      const languages = await detector.detectFromFileExtensions('/test/project');

      expect(languages).toContain('typescript');
    });

    it('should detect JavaScript files', async () => {
      mockGlob.mockResolvedValue(['src/app.js', 'src/utils.jsx']);

      const languages = await detector.detectFromFileExtensions('/test/project');

      expect(languages).toContain('javascript');
    });

    it('should detect Java files', async () => {
      mockGlob.mockResolvedValue(['src/main/java/App.java']);

      const languages = await detector.detectFromFileExtensions('/test/project');

      expect(languages).toContain('java');
    });

    it('should detect Python files', async () => {
      mockGlob.mockResolvedValue(['src/main.py', 'tests/test_app.py']);

      const languages = await detector.detectFromFileExtensions('/test/project');

      expect(languages).toContain('python');
    });

    it('should detect C# files', async () => {
      mockGlob.mockResolvedValue(['src/Program.cs', 'Models/User.cs']);

      const languages = await detector.detectFromFileExtensions('/test/project');

      expect(languages).toContain('csharp');
    });

    it('should detect multiple languages', async () => {
      mockGlob.mockResolvedValue([
        'frontend/app.ts',
        'backend/Main.java',
        'scripts/deploy.py'
      ]);

      const languages = await detector.detectFromFileExtensions('/test/project');

      expect(languages).toEqual(expect.arrayContaining(['typescript', 'java', 'python']));
    });

    it('should return empty array when no source files found', async () => {
      mockGlob.mockResolvedValue([]);

      const languages = await detector.detectFromFileExtensions('/test/project');

      expect(languages).toEqual([]);
    });

    it('should handle glob errors gracefully', async () => {
      mockGlob.mockRejectedValue(new Error('Glob error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const languages = await detector.detectFromFileExtensions('/test/project');

      expect(languages).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('detectPrimaryLanguage', () => {
    it('should return undefined for empty language array', async () => {
      const primary = await detector.detectPrimaryLanguage([], '/test/project');
      expect(primary).toBeUndefined();
    });

    it('should return the single language', async () => {
      const primary = await detector.detectPrimaryLanguage(['typescript'], '/test/project');
      expect(primary).toBe('typescript');
    });

    it('should prefer build file detection when available', async () => {
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: true,
        suggestions: [],
        detectedLanguages: ['typescript', 'java'],
        primaryLanguage: 'typescript',
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      });

      const primary = await detector.detectPrimaryLanguage(['typescript', 'java'], '/test/project');
      expect(primary).toBe('typescript');
    });

    it('should fall back to file count when no primary language from build files', async () => {
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: true,
        suggestions: [],
        detectedLanguages: ['typescript', 'java'],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      });

      // Mock glob calls for counting files
      mockGlob
        .mockResolvedValueOnce(['app.ts', 'utils.ts']) // 2 TypeScript files
        .mockResolvedValueOnce([]) // 0 TypeScript .tsx files
        .mockResolvedValueOnce(['Main.java']); // 1 Java file

      const primary = await detector.detectPrimaryLanguage(['typescript', 'java'], '/test/project');
      expect(primary).toBe('typescript');
    });
  });

  describe('detectLanguages', () => {
    it('should combine build file and extension detection', async () => {
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: true,
        suggestions: [],
        detectedLanguages: ['typescript'],
        primaryLanguage: 'typescript',
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      });

      mockGlob.mockResolvedValue(['app.ts', 'Main.java']); // Extension detection finds Java too

      const result = await detector.detectLanguages('/test/project');

      expect(result.languages).toEqual(expect.arrayContaining(['typescript', 'java']));
      expect(result.primaryLanguage).toBe('typescript');
      expect(result.buildFileLanguages).toEqual(['typescript']);
      expect(result.extensionLanguages).toEqual(expect.arrayContaining(['typescript', 'java']));
    });

    it('should deduplicate languages', async () => {
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: true,
        suggestions: [],
        detectedLanguages: ['typescript'],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      });

      mockGlob.mockResolvedValue(['app.ts']); // Both methods detect TypeScript

      const result = await detector.detectLanguages('/test/project');

      expect(result.languages).toEqual(['typescript']); // No duplicates
    });
  });

  describe('validateLanguages', () => {
    it('should identify supported languages', () => {
      const result = detector.validateLanguages(['typescript', 'java', 'python']);

      expect(result.supported).toEqual(['typescript', 'java', 'python']);
      expect(result.unsupported).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should identify unsupported languages', () => {
      const result = detector.validateLanguages(['csharp', 'typescript']);

      expect(result.supported).toEqual(['typescript']);
      expect(result.unsupported).toEqual(['csharp']);
      expect(result.warnings).toContain('⚠️ csharp is detected but not yet fully supported for parsing');
    });

    it('should warn when no supported languages found', () => {
      const result = detector.validateLanguages(['csharp', 'go']);

      expect(result.supported).toEqual([]);
      expect(result.unsupported).toEqual(['csharp', 'go']);
      expect(result.warnings).toContain('❌ No supported languages detected in project');
    });
  });

  describe('getRecommendedScanConfig', () => {
    it('should provide comprehensive scan configuration', async () => {
      // Mock language detection
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: true,
        suggestions: ['✅ TypeScript project detected'],
        detectedLanguages: ['typescript'],
        primaryLanguage: 'typescript',
        projectMetadata: [{
          name: 'test-project',
          language: 'typescript',
          buildSystem: 'npm',
          framework: 'React',
          buildFilePath: '/test/package.json'
        }],
        subProjects: [],
        isMonoRepo: false
      });

      mockGlob.mockResolvedValue(['app.ts']);

      const config = await detector.getRecommendedScanConfig('/test/project');

      expect(config.languages).toEqual(['typescript']);
      expect(config.primaryLanguage).toBe('typescript');
      expect(config.buildSystems).toEqual(['npm']);
      expect(config.frameworks).toEqual(['React']);
      expect(config.includeTests).toBe(true);
      expect(config.excludePaths).toContain('node_modules');
      expect(config.suggestions).toContain('✅ TypeScript project detected');
    });

    it('should add language-specific exclude paths', async () => {
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: true,
        suggestions: [],
        detectedLanguages: ['java', 'python'],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      });

      mockGlob.mockResolvedValue(['Main.java', 'app.py']);

      const config = await detector.getRecommendedScanConfig('/test/project');

      expect(config.excludePaths).toContain('target/**');
      expect(config.excludePaths).toContain('__pycache__/**');
      expect(config.excludePaths).toContain('*.pyc');
    });

    it('should suggest mono-repo handling', async () => {
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: true,
        suggestions: [],
        detectedLanguages: ['typescript'],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: true
      });

      mockGlob.mockResolvedValue(['app.ts']);

      const config = await detector.getRecommendedScanConfig('/test/project');

      expect(config.suggestions).toContain('🏗️ Mono-repository structure detected - consider scanning sub-projects separately');
    });

    it('should filter out unsupported languages', async () => {
      mockBuildFileDetector.detect.mockResolvedValue({
        isValid: true,
        suggestions: [],
        detectedLanguages: ['typescript', 'csharp'],
        projectMetadata: [],
        subProjects: [],
        isMonoRepo: false
      });

      mockGlob.mockResolvedValue(['app.ts', 'Program.cs']);

      const config = await detector.getRecommendedScanConfig('/test/project');

      expect(config.languages).toEqual(['typescript']); // C# filtered out
      expect(config.suggestions).toContain('⚠️ csharp is detected but not yet fully supported for parsing');
    });
  });
});