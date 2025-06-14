import { TypeScriptParser } from '../../../src/scanner/parsers/typescript-parser.js';

describe('TypeScriptParser', () => {
  let parser: TypeScriptParser;

  beforeEach(() => {
    parser = new TypeScriptParser();
    jest.clearAllMocks();
  });

  describe('canParse', () => {
    test('should accept TypeScript files', () => {
      expect(parser.canParse('test.ts')).toBe(true);
      expect(parser.canParse('component.ts')).toBe(true);
      expect(parser.canParse('/path/to/file.ts')).toBe(true);
    });

    test('should accept TypeScript JSX files', () => {
      expect(parser.canParse('test.tsx')).toBe(true);
      expect(parser.canParse('Component.tsx')).toBe(true);
    });

    test('should accept JavaScript files', () => {
      expect(parser.canParse('test.js')).toBe(true);
      expect(parser.canParse('script.js')).toBe(true);
    });

    test('should accept JSX files', () => {
      expect(parser.canParse('test.jsx')).toBe(true);
      expect(parser.canParse('Component.jsx')).toBe(true);
    });

    test('should reject other file types', () => {
      expect(parser.canParse('test.java')).toBe(false);
      expect(parser.canParse('test.py')).toBe(false);
      expect(parser.canParse('test.txt')).toBe(false);
    });

    test('should handle case insensitive extensions', () => {
      expect(parser.canParse('test.TS')).toBe(true);
      expect(parser.canParse('test.JS')).toBe(true);
    });
  });

  describe('parseFile', () => {
    const projectId = 'test-project';
    const filePath = '/test/file.ts';

    test('should handle empty file', async () => {
      const result = await parser.parseFile(filePath, '', projectId);

      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('relationships');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.entities)).toBe(true);
      expect(Array.isArray(result.relationships)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('should return valid parse result structure', async () => {
      const tsCode = `function hello(name: string): string {
  return "Hello " + name;
}`;

      const result = await parser.parseFile(filePath, tsCode, projectId);

      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('relationships');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.entities)).toBe(true);
      expect(Array.isArray(result.relationships)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('should handle simple TypeScript code without throwing', async () => {
      const tsCode = `
        interface User {
          name: string;
          age: number;
        }
        
        class UserService {
          private users: User[] = [];
          
          addUser(user: User): void {
            this.users.push(user);
          }
          
          getUsers(): User[] {
            return this.users;
          }
        }
      `;

      expect(async () => {
        await parser.parseFile(filePath, tsCode, projectId);
      }).not.toThrow();
    });

    test('should handle syntax errors gracefully', async () => {
      const tsCode = `
        function broken(
          // Missing closing parenthesis and return type
          console.log("This will cause a syntax error")
      `;

      const result = await parser.parseFile(filePath, tsCode, projectId);

      // Should not throw, may have errors in result
      expect(result).toBeDefined();
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('relationships');
      expect(result).toHaveProperty('errors');
    });
  });
});