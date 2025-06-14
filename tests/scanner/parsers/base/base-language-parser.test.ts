import { BaseLanguageParser } from '../../../../src/scanner/parsers/base/BaseLanguageParser.js';
import { ParsedEntity, ParsedRelationship, ParseError } from '../../../../src/scanner/types.js';

describe('BaseLanguageParser', () => {
  class TestParser extends BaseLanguageParser {
    canParse(filePath: string): boolean {
      return filePath.endsWith('.test');
    }

    async parseFile(filePath: string, content: string, projectId: string) {
      this.setCurrentProject(projectId);
      
      const entities: ParsedEntity[] = [];
      const relationships: ParsedRelationship[] = [];
      const errors: ParseError[] = [];

      // Add test entities using the helper methods
      this.addEntity(entities, {
        id: 'test-entity',
        type: 'function',
        name: 'testFunction',
        qualified_name: 'testFunction',
        source_file: filePath
      });

      this.addRelationship(relationships, {
        id: 'test-relationship',
        type: 'calls',
        source: 'caller',
        target: 'callee',
        source_file: filePath
      });

      this.addError(errors, {
        file_path: filePath,
        message: 'Test error',
        severity: 'warning'
      });

      return { entities, relationships, errors };
    }
  }

  let parser: TestParser;

  beforeEach(() => {
    parser = new TestParser();
  });

  describe('canParse', () => {
    test('should identify supported files', () => {
      expect(parser.canParse('file.test')).toBe(true);
      expect(parser.canParse('file.other')).toBe(false);
    });
  });

  describe('addEntity', () => {
    test('should add entity with project_id', async () => {
      const result = await parser.parseFile('/test/file.test', 'content', 'test-project');

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0]).toMatchObject({
        id: 'test-entity',
        project_id: 'test-project',
        type: 'function',
        name: 'testFunction',
        qualified_name: 'testFunction',
        source_file: '/test/file.test'
      });
    });

    test('should handle multiple entities', async () => {
      class MultiEntityParser extends BaseLanguageParser {
        canParse(filePath: string): boolean {
          return true;
        }

        async parseFile(filePath: string, content: string, projectId: string) {
          this.setCurrentProject(projectId);
          
          const entities: ParsedEntity[] = [];
          const relationships: ParsedRelationship[] = [];
          const errors: ParseError[] = [];

          this.addEntity(entities, {
            id: 'entity1',
            type: 'class',
            name: 'Class1',
            qualified_name: 'Class1',
            source_file: filePath
          });

          this.addEntity(entities, {
            id: 'entity2',
            type: 'method',
            name: 'method1',
            qualified_name: 'Class1.method1',
            source_file: filePath
          });

          return { entities, relationships, errors };
        }
      }

      const multiParser = new MultiEntityParser();
      const result = await multiParser.parseFile('/test/file.test', 'content', 'multi-project');

      expect(result.entities).toHaveLength(2);
      expect(result.entities[0].project_id).toBe('multi-project');
      expect(result.entities[1].project_id).toBe('multi-project');
    });
  });

  describe('addRelationship', () => {
    test('should add relationship with project_id', async () => {
      const result = await parser.parseFile('/test/file.test', 'content', 'test-project');

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0]).toMatchObject({
        id: 'test-relationship',
        project_id: 'test-project',
        type: 'calls',
        source: 'caller',
        target: 'callee',
        source_file: '/test/file.test'
      });
    });

    test('should handle multiple relationships', async () => {
      class MultiRelationParser extends BaseLanguageParser {
        canParse(filePath: string): boolean {
          return true;
        }

        async parseFile(filePath: string, content: string, projectId: string) {
          this.setCurrentProject(projectId);
          
          const entities: ParsedEntity[] = [];
          const relationships: ParsedRelationship[] = [];
          const errors: ParseError[] = [];

          this.addRelationship(relationships, {
            id: 'rel1',
            type: 'extends',
            source: 'Child',
            target: 'Parent',
            source_file: filePath
          });

          this.addRelationship(relationships, {
            id: 'rel2',
            type: 'implements',
            source: 'Class',
            target: 'Interface',
            source_file: filePath
          });

          return { entities, relationships, errors };
        }
      }

      const multiParser = new MultiRelationParser();
      const result = await multiParser.parseFile('/test/file.test', 'content', 'multi-project');

      expect(result.relationships).toHaveLength(2);
      expect(result.relationships[0].project_id).toBe('multi-project');
      expect(result.relationships[1].project_id).toBe('multi-project');
    });
  });

  describe('addError', () => {
    test('should add error with project_id', async () => {
      const result = await parser.parseFile('/test/file.test', 'content', 'test-project');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        file_path: '/test/file.test',
        project_id: 'test-project',
        message: 'Test error',
        severity: 'warning'
      });
    });

    test('should handle multiple errors', async () => {
      class MultiErrorParser extends BaseLanguageParser {
        canParse(filePath: string): boolean {
          return true;
        }

        async parseFile(filePath: string, content: string, projectId: string) {
          this.setCurrentProject(projectId);
          
          const entities: ParsedEntity[] = [];
          const relationships: ParsedRelationship[] = [];
          const errors: ParseError[] = [];

          this.addError(errors, {
            file_path: filePath,
            line: 10,
            message: 'Syntax error',
            severity: 'error'
          });

          this.addError(errors, {
            file_path: filePath,
            line: 20,
            message: 'Unused variable',
            severity: 'warning'
          });

          return { entities, relationships, errors };
        }
      }

      const multiParser = new MultiErrorParser();
      const result = await multiParser.parseFile('/test/file.test', 'content', 'multi-project');

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].project_id).toBe('multi-project');
      expect(result.errors[1].project_id).toBe('multi-project');
      expect(result.errors[0].severity).toBe('error');
      expect(result.errors[1].severity).toBe('warning');
    });
  });

  describe('setCurrentProject', () => {
    test('should set project_id for all subsequent entities', async () => {
      class ProjectTestParser extends BaseLanguageParser {
        canParse(filePath: string): boolean {
          return true;
        }

        async parseFile(filePath: string, content: string, projectId: string) {
          // First set to one project
          this.setCurrentProject('project1');
          
          const entities1: ParsedEntity[] = [];
          this.addEntity(entities1, {
            id: 'entity1',
            type: 'class',
            name: 'Class1',
            qualified_name: 'Class1',
            source_file: filePath
          });

          // Change to another project
          this.setCurrentProject('project2');
          
          const entities2: ParsedEntity[] = [];
          this.addEntity(entities2, {
            id: 'entity2',
            type: 'class',
            name: 'Class2',
            qualified_name: 'Class2',
            source_file: filePath
          });

          return { 
            entities: [...entities1, ...entities2], 
            relationships: [], 
            errors: [] 
          };
        }
      }

      const projectParser = new ProjectTestParser();
      const result = await projectParser.parseFile('/test/file.test', 'content', 'ignored');

      expect(result.entities).toHaveLength(2);
      expect(result.entities[0].project_id).toBe('project1');
      expect(result.entities[1].project_id).toBe('project2');
    });
  });

  describe('abstract methods', () => {
    test('should enforce implementation of abstract methods', () => {
      // This test verifies that the base class correctly defines abstract methods
      // TypeScript prevents instantiation of abstract classes at compile time
      // We can test this by verifying the class has the expected abstract methods
      expect(typeof BaseLanguageParser.prototype.canParse).toBe('undefined');
      expect(typeof BaseLanguageParser.prototype.parseFile).toBe('undefined');
    });
  });

  describe('integration test', () => {
    test('should work with complete parsing workflow', async () => {
      class CompleteParser extends BaseLanguageParser {
        canParse(filePath: string): boolean {
          return filePath.endsWith('.complete');
        }

        async parseFile(filePath: string, content: string, projectId: string) {
          this.setCurrentProject(projectId);
          
          const entities: ParsedEntity[] = [];
          const relationships: ParsedRelationship[] = [];
          const errors: ParseError[] = [];

          // Parse a class
          this.addEntity(entities, {
            id: 'class1',
            type: 'class',
            name: 'TestClass',
            qualified_name: 'com.test.TestClass',
            source_file: filePath,
            start_line: 1,
            end_line: 10,
            modifiers: ['public']
          });

          // Parse a method in the class
          this.addEntity(entities, {
            id: 'method1',
            type: 'method',
            name: 'testMethod',
            qualified_name: 'com.test.TestClass.testMethod',
            source_file: filePath,
            start_line: 3,
            end_line: 7,
            modifiers: ['public'],
            attributes: {
              return_type: 'void',
              parameters: [{
                name: 'param1',
                type: 'String'
              }]
            }
          });

          // Add containment relationship
          this.addRelationship(relationships, {
            id: 'contains1',
            type: 'contains',
            source: 'class1',
            target: 'method1',
            source_file: filePath
          });

          // Add a warning
          this.addError(errors, {
            file_path: filePath,
            line: 5,
            message: 'Consider adding documentation',
            severity: 'warning'
          });

          return { entities, relationships, errors };
        }
      }

      const completeParser = new CompleteParser();
      
      expect(completeParser.canParse('test.complete')).toBe(true);
      expect(completeParser.canParse('test.other')).toBe(false);

      const result = await completeParser.parseFile('/src/Test.complete', 'class TestClass { void testMethod(String param1) {} }', 'integration-test');

      expect(result.entities).toHaveLength(2);
      expect(result.relationships).toHaveLength(1);
      expect(result.errors).toHaveLength(1);

      // Verify class entity
      const classEntity = result.entities.find(e => e.type === 'class');
      expect(classEntity).toMatchObject({
        id: 'class1',
        project_id: 'integration-test',
        name: 'TestClass',
        qualified_name: 'com.test.TestClass',
        modifiers: ['public']
      });

      // Verify method entity
      const methodEntity = result.entities.find(e => e.type === 'method');
      expect(methodEntity).toMatchObject({
        id: 'method1',
        project_id: 'integration-test',
        name: 'testMethod',
        attributes: {
          return_type: 'void',
          parameters: [{ name: 'param1', type: 'String' }]
        }
      });

      // Verify relationship
      expect(result.relationships[0]).toMatchObject({
        id: 'contains1',
        project_id: 'integration-test',
        type: 'contains',
        source: 'class1',
        target: 'method1'
      });

      // Verify error
      expect(result.errors[0]).toMatchObject({
        project_id: 'integration-test',
        file_path: '/src/Test.complete',
        line: 5,
        message: 'Consider adding documentation',
        severity: 'warning'
      });
    });
  });
});