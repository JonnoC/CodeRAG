import { ProjectLanguageDetector } from '../../../src/scanner/detection/language-detector.js';
import { ProjectBuildFileDetector } from '../../../src/scanner/detection/build-file-detector.js';

// Simple integration test to verify the components work together
describe('Language Detection Integration', () => {
  let languageDetector: ProjectLanguageDetector;
  let buildFileDetector: ProjectBuildFileDetector;

  beforeEach(() => {
    languageDetector = new ProjectLanguageDetector();
    buildFileDetector = new ProjectBuildFileDetector();
  });

  describe('Component Integration', () => {
    it('should instantiate language detector successfully', () => {
      expect(languageDetector).toBeInstanceOf(ProjectLanguageDetector);
    });

    it('should instantiate build file detector successfully', () => {
      expect(buildFileDetector).toBeInstanceOf(ProjectBuildFileDetector);
    });

    it('should have required methods on language detector', () => {
      expect(typeof languageDetector.detectFromBuildFiles).toBe('function');
      expect(typeof languageDetector.detectFromFileExtensions).toBe('function');
      expect(typeof languageDetector.detectPrimaryLanguage).toBe('function');
      expect(typeof languageDetector.detectLanguages).toBe('function');
      expect(typeof languageDetector.validateLanguages).toBe('function');
      expect(typeof languageDetector.getRecommendedScanConfig).toBe('function');
    });

    it('should have required methods on build file detector', () => {
      expect(typeof buildFileDetector.detect).toBe('function');
      expect(typeof buildFileDetector.canDetect).toBe('function');
      expect(typeof buildFileDetector.extractMetadata).toBe('function');
    });

    it('should validate language correctly', () => {
      const result = languageDetector.validateLanguages(['typescript', 'java', 'csharp']);
      
      expect(result.supported).toContain('typescript');
      expect(result.supported).toContain('java');
      expect(result.unsupported).toContain('csharp');
      expect(result.warnings).toContain('⚠️ csharp is detected but not yet fully supported for parsing');
    });

    it('should detect build files by extension', () => {
      expect(buildFileDetector.canDetect('/path/to/package.json')).toBe(true);
      expect(buildFileDetector.canDetect('/path/to/pom.xml')).toBe(true);
      expect(buildFileDetector.canDetect('/path/to/build.gradle')).toBe(true);
      expect(buildFileDetector.canDetect('/path/to/setup.py')).toBe(true);
      expect(buildFileDetector.canDetect('/path/to/pyproject.toml')).toBe(true);
      expect(buildFileDetector.canDetect('/path/to/MyProject.csproj')).toBe(true);
      expect(buildFileDetector.canDetect('/path/to/unknown.txt')).toBe(false);
    });
  });
});