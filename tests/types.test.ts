import { CodeNode, CodeEdge } from '../src/types.js';

describe('Types', () => {
  test('should create a valid CodeNode', () => {
    const node: CodeNode = {
      id: 'test-id',
      project_id: 'test-project',
      type: 'class',
      name: 'TestClass',
      qualified_name: 'com.example.TestClass',
      description: 'A test class',
      source_file: 'TestClass.java',
      start_line: 10,
      end_line: 50,
      modifiers: ['public'],
      attributes: {
        parameters: [
          {
            name: 'param1',
            type: 'String',
            description: 'First parameter'
          }
        ],
        return_type: 'void'
      }
    };

    expect(node.id).toBe('test-id');
    expect(node.type).toBe('class');
    expect(node.name).toBe('TestClass');
    expect(node.qualified_name).toBe('com.example.TestClass');
    expect(node.attributes?.parameters?.[0].name).toBe('param1');
  });

  test('should create a valid CodeEdge', () => {
    const edge: CodeEdge = {
      id: 'edge-id',
      project_id: 'test-project',
      type: 'implements',
      source: 'source-node-id',
      target: 'target-node-id',
      attributes: {
        weight: 1.0
      }
    };

    expect(edge.id).toBe('edge-id');
    expect(edge.type).toBe('implements');
    expect(edge.source).toBe('source-node-id');
    expect(edge.target).toBe('target-node-id');
    expect(edge.attributes?.weight).toBe(1.0);
  });

  test('should allow minimal CodeNode', () => {
    const node: CodeNode = {
      id: 'minimal-id',
      project_id: 'test-project',
      type: 'function',
      name: 'testFunction',
      qualified_name: 'testFunction'
    };

    expect(node.id).toBe('minimal-id');
    expect(node.type).toBe('function');
    expect(node.description).toBeUndefined();
    expect(node.attributes).toBeUndefined();
  });

  test('should allow minimal CodeEdge', () => {
    const edge: CodeEdge = {
      id: 'minimal-edge-id',
      project_id: 'test-project',
      type: 'calls',
      source: 'source-id',
      target: 'target-id'
    };

    expect(edge.id).toBe('minimal-edge-id');
    expect(edge.type).toBe('calls');
    expect(edge.attributes).toBeUndefined();
  });
});