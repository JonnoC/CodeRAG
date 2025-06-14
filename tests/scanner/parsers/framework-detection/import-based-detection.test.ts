import { FrameworkDetectionContext } from '../../../../src/scanner/parsers/framework-detection/FrameworkDetectionTypes.js';
import { JavaFrameworkDetector } from '../../../../src/scanner/parsers/framework-detection/java/JavaFrameworkDetector.js';
import { TypeScriptFrameworkDetector } from '../../../../src/scanner/parsers/framework-detection/typescript/TypeScriptFrameworkDetector.js';
import { ParsedImport } from '../../../../src/scanner/parsers/extractors/base/ContentExtractor.js';

describe('Import-Based Framework Detection', () => {
  let javaDetector: JavaFrameworkDetector;
  let typescriptDetector: TypeScriptFrameworkDetector;

  beforeEach(() => {
    javaDetector = new JavaFrameworkDetector();
    typescriptDetector = new TypeScriptFrameworkDetector();
  });

  describe('Spring Boot Detection', () => {
    it('should detect Spring Boot from core imports with high confidence', () => {
      const imports: ParsedImport[] = [
        { module: 'org.springframework.boot.SpringApplication', items: ['SpringApplication'] },
        { module: 'org.springframework.boot.autoconfigure.SpringBootApplication', items: ['SpringBootApplication'] }
      ];

      const result = javaDetector.detectFrameworkFromImports(imports);
      
      expect(result.framework).toBe('Spring Boot');
      expect(result.confidence).toBeGreaterThan(90);
      expect(result.detectionMethod).toBe('import');
      expect(result.details?.matchedImports).toContain('org.springframework.boot.SpringApplication');
    });

    it('should detect Spring Security from security imports', () => {
      const imports: ParsedImport[] = [
        { module: 'org.springframework.security.access.prepost.PreAuthorize', items: ['PreAuthorize'] },
        { module: 'org.springframework.security.config.annotation.web.builders.HttpSecurity', items: ['HttpSecurity'] }
      ];

      const result = javaDetector.detectFrameworkFromImports(imports);
      
      expect(result.framework).toBe('Spring Security');
      expect(result.confidence).toBeGreaterThan(85);
    });

    it('should combine annotation and import detection for higher confidence', () => {
      const context: FrameworkDetectionContext = {
        annotations: ['RestController', 'Autowired'],
        imports: [
          { module: 'org.springframework.boot.SpringApplication', items: ['SpringApplication'] },
          { module: 'org.springframework.web.bind.annotation.RestController', items: ['RestController'] }
        ]
      };

      const result = javaDetector.detectFrameworkWithContext(context);
      
      expect(result.framework).toBe('Spring Boot');
      expect(result.confidence).toBeGreaterThan(95); // Should be higher than annotation or import alone
      expect(result.detectionMethod).toBe('combined');
      expect(result.details?.matchedAnnotations).toContain('RestController');
      expect(result.details?.matchedImports).toContain('org.springframework.boot.SpringApplication');
    });
  });

  describe('NestJS vs Angular Disambiguation', () => {
    it('should detect NestJS when @Injectable comes from @nestjs/common', () => {
      const context: FrameworkDetectionContext = {
        annotations: ['Injectable', 'Controller'],
        imports: [
          { module: '@nestjs/common', items: ['Injectable', 'Controller'] },
          { module: '@nestjs/core', items: ['NestFactory'] }
        ]
      };

      const result = typescriptDetector.detectFrameworkWithContext(context);
      
      expect(result.framework).toBe('NestJS');
      expect(result.confidence).toBeGreaterThan(90);
      expect(result.detectionMethod).toBe('combined');
    });

    it('should detect Angular when @Injectable comes from @angular/core', () => {
      const context: FrameworkDetectionContext = {
        annotations: ['Injectable', 'Component'],
        imports: [
          { module: '@angular/core', items: ['Injectable', 'Component'] },
          { module: '@angular/common', items: ['CommonModule'] }
        ]
      };

      const result = typescriptDetector.detectFrameworkWithContext(context);
      
      expect(result.framework).toBe('Angular');
      expect(result.confidence).toBeGreaterThan(90);
      expect(result.detectionMethod).toBe('combined');
    });

    it('should prefer import-based detection when annotation is ambiguous', () => {
      const context: FrameworkDetectionContext = {
        annotations: ['Injectable'], // Ambiguous between Angular and NestJS
        imports: [
          { module: '@nestjs/common', items: ['Injectable'] }
        ]
      };

      const result = typescriptDetector.detectFrameworkWithContext(context);
      
      expect(result.framework).toBe('NestJS');
      expect(result.confidence).toBeGreaterThan(80);
    });
  });

  describe('Framework Statistics', () => {
    it('should report import patterns in framework statistics', () => {
      const stats = javaDetector.getFrameworkStatistics();
      
      expect(stats.totalImportPatterns).toBeGreaterThan(0);
      expect(stats.moduleBreakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Spring Boot',
            importPatternCount: expect.any(Number)
          })
        ])
      );
    });

    it('should report TypeScript framework import patterns', () => {
      const stats = typescriptDetector.getFrameworkStatistics();
      
      expect(stats.totalImportPatterns).toBeGreaterThan(0);
      expect(stats.moduleBreakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'NestJS',
            importPatternCount: expect.any(Number)
          }),
          expect.objectContaining({
            name: 'Angular',
            importPatternCount: expect.any(Number)
          })
        ])
      );
    });
  });

  describe('Import Pattern Matching', () => {
    it('should match wildcard patterns correctly', () => {
      const imports: ParsedImport[] = [
        { module: 'org.springframework.boot.context.properties.ConfigurationProperties', items: ['ConfigurationProperties'] }
      ];

      const result = javaDetector.detectFrameworkFromImports(imports);
      
      expect(result.framework).toBe('Spring Boot');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle exact package matches', () => {
      const imports: ParsedImport[] = [
        { module: '@nestjs/common', items: ['Injectable'] }
      ];

      const result = typescriptDetector.detectFrameworkFromImports(imports);
      
      expect(result.framework).toBe('NestJS');
      expect(result.confidence).toBe(95); // Should match exact confidence from pattern
    });
  });
});