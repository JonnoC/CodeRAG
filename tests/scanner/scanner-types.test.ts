import { 
  ScanConfig, 
  Language, 
  ParsedEntity, 
  ParsedRelationship, 
  ParseResult, 
  ParseError, 
  LanguageParser 
} from '../../src/scanner/types.js';

describe('Scanner Types', () => {
  describe('ScanConfig', () => {
    test('should create valid ScanConfig with required fields', () => {
      const config: ScanConfig = {
        projectPath: '/test/project',
        projectId: 'test-project',
        languages: ['typescript']
      };

      expect(config.projectPath).toBe('/test/project');
      expect(config.projectId).toBe('test-project');
      expect(config.languages).toContain('typescript');
    });

    test('should accept optional fields', () => {
      const config: ScanConfig = {
        projectPath: '/test/project',
        projectId: 'test-project',
        projectName: 'Test Project',
        languages: ['typescript', 'javascript'],
        excludePaths: ['node_modules/**', 'dist/**'],
        includeTests: true,
        maxDepth: 5,
        outputProgress: true
      };

      expect(config.projectName).toBe('Test Project');
      expect(config.excludePaths).toContain('node_modules/**');
      expect(config.includeTests).toBe(true);
      expect(config.maxDepth).toBe(5);
      expect(config.outputProgress).toBe(true);
    });
  });

  describe('Language type', () => {
    test('should accept valid language values', () => {
      const languages: Language[] = ['typescript', 'javascript', 'java', 'python', 'csharp'];
      
      expect(languages).toContain('typescript');
      expect(languages).toContain('javascript');
      expect(languages).toContain('java');
      expect(languages).toContain('python');
      expect(languages).toContain('csharp');
    });
  });

  describe('ParsedEntity', () => {
    test('should create valid ParsedEntity with required fields', () => {
      const entity: ParsedEntity = {
        id: 'test-entity-1',
        project_id: 'test-project',
        type: 'class',
        name: 'TestClass',
        qualified_name: 'com.test.TestClass',
        source_file: '/test/TestClass.java'
      };

      expect(entity.id).toBe('test-entity-1');
      expect(entity.type).toBe('class');
      expect(entity.name).toBe('TestClass');
      expect(entity.qualified_name).toBe('com.test.TestClass');
    });

    test('should accept all entity types', () => {
      const entityTypes: ParsedEntity['type'][] = [
        'class', 'interface', 'enum', 'exception', 
        'function', 'method', 'field', 'package', 'module'
      ];

      entityTypes.forEach(type => {
        const entity: ParsedEntity = {
          id: `test-${type}`,
          project_id: 'test-project',
          type,
          name: `Test${type}`,
          qualified_name: `test.${type}`,
          source_file: '/test/file'
        };

        expect(entity.type).toBe(type);
      });
    });

    test('should include optional fields', () => {
      const entity: ParsedEntity = {
        id: 'test-method',
        project_id: 'test-project',
        type: 'method',
        name: 'testMethod',
        qualified_name: 'TestClass.testMethod',
        source_file: '/test/TestClass.java',
        description: 'A test method',
        start_line: 10,
        end_line: 15,
        modifiers: ['public', 'static'],
        annotations: [{ name: 'Test', framework: 'junit' }],
        attributes: {
          parameters: [{
            name: 'param1',
            type: 'String',
            description: 'First parameter'
          }],
          return_type: 'void',
          implements: ['Runnable'],
          extends: 'BaseClass'
        }
      };

      expect(entity.description).toBe('A test method');
      expect(entity.start_line).toBe(10);
      expect(entity.end_line).toBe(15);
      expect(entity.modifiers).toContain('public');
      expect(entity.attributes?.parameters).toHaveLength(1);
      expect(entity.attributes?.return_type).toBe('void');
    });
  });

  describe('ParsedRelationship', () => {
    test('should create valid ParsedRelationship with required fields', () => {
      const relationship: ParsedRelationship = {
        id: 'rel-1',
        project_id: 'test-project',
        type: 'extends',
        source: 'ChildClass',
        target: 'ParentClass',
        source_file: '/test/ChildClass.java'
      };

      expect(relationship.id).toBe('rel-1');
      expect(relationship.type).toBe('extends');
      expect(relationship.source).toBe('ChildClass');
      expect(relationship.target).toBe('ParentClass');
    });

    test('should accept all relationship types', () => {
      const relationshipTypes: ParsedRelationship['type'][] = [
        'calls', 'implements', 'extends', 'contains', 
        'references', 'throws', 'belongs_to'
      ];

      relationshipTypes.forEach(type => {
        const relationship: ParsedRelationship = {
          id: `rel-${type}`,
          project_id: 'test-project',
          type,
          source: 'source',
          target: 'target',
          source_file: '/test/file'
        };

        expect(relationship.type).toBe(type);
      });
    });

    test('should include optional attributes', () => {
      const relationship: ParsedRelationship = {
        id: 'rel-calls',
        project_id: 'test-project',
        type: 'calls',
        source: 'methodA',
        target: 'methodB',
        source_file: '/test/file.ts',
        attributes: {
          line_number: 42,
          call_type: 'direct',
          arguments: ['arg1', 'arg2']
        }
      };

      expect(relationship.attributes?.line_number).toBe(42);
      expect(relationship.attributes?.call_type).toBe('direct');
      expect(relationship.attributes?.arguments).toContain('arg1');
    });
  });

  describe('ParseResult', () => {
    test('should create valid ParseResult', () => {
      const result: ParseResult = {
        entities: [{
          id: 'entity-1',
          project_id: 'test-project',
          type: 'class',
          name: 'TestClass',
          qualified_name: 'TestClass',
          source_file: '/test/file.ts'
        }],
        relationships: [{
          id: 'rel-1',
          project_id: 'test-project',
          type: 'contains',
          source: 'entity-1',
          target: 'method-1',
          source_file: '/test/file.ts'
        }],
        errors: [{
          file_path: '/test/file.ts',
          line: 10,
          message: 'Warning: unused variable',
          severity: 'warning'
        }],
        stats: {
          filesProcessed: 5,
          entitiesFound: 25,
          relationshipsFound: 15,
          processingTimeMs: 1500
        }
      };

      expect(result.entities).toHaveLength(1);
      expect(result.relationships).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.stats.filesProcessed).toBe(5);
      expect(result.stats.entitiesFound).toBe(25);
      expect(result.stats.relationshipsFound).toBe(15);
      expect(result.stats.processingTimeMs).toBe(1500);
    });
  });

  describe('ParseError', () => {
    test('should create valid ParseError with required fields', () => {
      const error: ParseError = {
        file_path: '/test/file.ts',
        message: 'Syntax error at line 10'
      };

      expect(error.file_path).toBe('/test/file.ts');
      expect(error.message).toBe('Syntax error at line 10');
    });

    test('should include optional fields', () => {
      const error: ParseError = {
        project_id: 'test-project',
        file_path: '/test/file.ts',
        line: 10,
        message: 'Unexpected token',
        severity: 'error'
      };

      expect(error.project_id).toBe('test-project');
      expect(error.line).toBe(10);
      expect(error.severity).toBe('error');
    });

    test('should accept warning and error severity', () => {
      const warningError: ParseError = {
        file_path: '/test/file.ts',
        message: 'Unused variable',
        severity: 'warning'
      };

      const fatalError: ParseError = {
        file_path: '/test/file.ts',
        message: 'Syntax error',
        severity: 'error'
      };

      expect(warningError.severity).toBe('warning');
      expect(fatalError.severity).toBe('error');
    });
  });

  describe('LanguageParser interface', () => {
    test('should define required methods', () => {
      class MockParser implements LanguageParser {
        canParse(filePath: string): boolean {
          return filePath.endsWith('.mock');
        }

        async parseFile(filePath: string, content: string, projectId: string) {
          return {
            entities: [],
            relationships: [],
            errors: []
          };
        }
      }

      const parser = new MockParser();
      
      expect(typeof parser.canParse).toBe('function');
      expect(typeof parser.parseFile).toBe('function');
      expect(parser.canParse('test.mock')).toBe(true);
      expect(parser.canParse('test.other')).toBe(false);
    });

    test('should return correct parseFile result type', async () => {
      class MockParser implements LanguageParser {
        canParse(filePath: string): boolean {
          return true;
        }

        async parseFile(filePath: string, content: string, projectId: string) {
          return {
            entities: [{
              id: 'mock-entity',
              project_id: projectId,
              type: 'function' as const,
              name: 'mockFunction',
              qualified_name: 'mockFunction',
              source_file: filePath
            }],
            relationships: [],
            errors: []
          };
        }
      }

      const parser = new MockParser();
      const result = await parser.parseFile('/test/file.mock', 'content', 'test-project');

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].name).toBe('mockFunction');
      expect(result.entities[0].project_id).toBe('test-project');
    });
  });
});