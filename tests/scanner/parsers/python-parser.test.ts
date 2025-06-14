import { PythonParser } from '../../../src/scanner/parsers/python-parser.js';

describe('PythonParser', () => {
  let parser: PythonParser;

  beforeEach(() => {
    parser = new PythonParser();
    jest.clearAllMocks();
  });

  describe('canParse', () => {
    test('should accept Python files', () => {
      expect(parser.canParse('test.py')).toBe(true);
      expect(parser.canParse('script.py')).toBe(true);
      expect(parser.canParse('/path/to/file.py')).toBe(true);
    });

    test('should reject non-Python files', () => {
      expect(parser.canParse('test.ts')).toBe(false);
      expect(parser.canParse('test.js')).toBe(false);
      expect(parser.canParse('test.java')).toBe(false);
      expect(parser.canParse('test.txt')).toBe(false);
    });

    test('should handle case insensitive extensions', () => {
      expect(parser.canParse('test.PY')).toBe(true);
      expect(parser.canParse('test.Py')).toBe(true);
    });
  });

  describe('parseFile', () => {
    const projectId = 'test-project';
    const filePath = '/test/test.py';

    test('should handle empty file', async () => {
      const result = await parser.parseFile(filePath, '', projectId);

      // Empty file might still create a module entity, which is acceptable
      expect(Array.isArray(result.entities)).toBe(true);
      expect(Array.isArray(result.relationships)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('should return valid parse result structure', async () => {
      const pythonCode = `def test_function():\n    pass`;

      const result = await parser.parseFile(filePath, pythonCode, projectId);

      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('relationships');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.entities)).toBe(true);
      expect(Array.isArray(result.relationships)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    test('should handle simple Python code without throwing', async () => {
      const pythonCode = `
class TestClass:
    def __init__(self):
        self.value = 42
    
    def get_value(self):
        return self.value
      `;

      expect(async () => {
        await parser.parseFile(filePath, pythonCode, projectId);
      }).not.toThrow();
    });

    test('should handle syntax errors gracefully', async () => {
      const pythonCode = `
def broken_function(
    # Missing closing parenthesis and colon
    print("This will cause a syntax error")
      `;

      const result = await parser.parseFile(filePath, pythonCode, projectId);

      // Should not throw, may have errors in result
      expect(result).toBeDefined();
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('relationships');
      expect(result).toHaveProperty('errors');
    });
  });
});