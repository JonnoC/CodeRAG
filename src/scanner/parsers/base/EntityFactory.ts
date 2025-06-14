import { ParsedEntity } from '../../types.js';
import { AnnotationInfo } from '../../../types.js';

export class EntityFactory {
  static createClass(
    id: string,
    name: string,
    qualifiedName: string,
    sourceFile: string,
    startLine?: number,
    endLine?: number,
    modifiers?: string[],
    description?: string,
    annotations?: AnnotationInfo[]
  ): Omit<ParsedEntity, 'project_id'> {
    return {
      id,
      type: 'class',
      name,
      qualified_name: qualifiedName,
      source_file: sourceFile,
      start_line: startLine,
      end_line: endLine,
      modifiers: modifiers || [],
      description,
      annotations: annotations || []
    };
  }

  static createInterface(
    id: string,
    name: string,
    qualifiedName: string,
    sourceFile: string,
    startLine?: number,
    endLine?: number,
    modifiers?: string[],
    description?: string,
    annotations?: AnnotationInfo[]
  ): Omit<ParsedEntity, 'project_id'> {
    return {
      id,
      type: 'interface',
      name,
      qualified_name: qualifiedName,
      source_file: sourceFile,
      start_line: startLine,
      end_line: endLine,
      modifiers: modifiers || [],
      description,
      annotations: annotations || []
    };
  }

  static createMethod(
    id: string,
    name: string,
    qualifiedName: string,
    sourceFile: string,
    startLine?: number,
    endLine?: number,
    modifiers?: string[],
    description?: string,
    annotations?: AnnotationInfo[]
  ): Omit<ParsedEntity, 'project_id'> {
    return {
      id,
      type: 'method',
      name,
      qualified_name: qualifiedName,
      source_file: sourceFile,
      start_line: startLine,
      end_line: endLine,
      modifiers: modifiers || [],
      description,
      annotations: annotations || []
    };
  }

  static createFunction(
    id: string,
    name: string,
    qualifiedName: string,
    sourceFile: string,
    startLine?: number,
    endLine?: number,
    modifiers?: string[],
    description?: string,
    annotations?: AnnotationInfo[]
  ): Omit<ParsedEntity, 'project_id'> {
    return {
      id,
      type: 'function',
      name,
      qualified_name: qualifiedName,
      source_file: sourceFile,
      start_line: startLine,
      end_line: endLine,
      modifiers: modifiers || [],
      description,
      annotations: annotations || []
    };
  }

  static createField(
    id: string,
    name: string,
    qualifiedName: string,
    sourceFile: string,
    startLine?: number,
    endLine?: number,
    modifiers?: string[],
    description?: string,
    annotations?: AnnotationInfo[]
  ): Omit<ParsedEntity, 'project_id'> {
    return {
      id,
      type: 'field',
      name,
      qualified_name: qualifiedName,
      source_file: sourceFile,
      start_line: startLine,
      end_line: endLine,
      modifiers: modifiers || [],
      description,
      annotations: annotations || []
    };
  }

  static createEnum(
    id: string,
    name: string,
    qualifiedName: string,
    sourceFile: string,
    startLine?: number,
    endLine?: number,
    modifiers?: string[],
    description?: string,
    annotations?: AnnotationInfo[]
  ): Omit<ParsedEntity, 'project_id'> {
    return {
      id,
      type: 'enum',
      name,
      qualified_name: qualifiedName,
      source_file: sourceFile,
      start_line: startLine,
      end_line: endLine,
      modifiers: modifiers || [],
      description,
      annotations: annotations || []
    };
  }

  static createPackage(
    id: string,
    name: string,
    qualifiedName: string,
    sourceFile: string,
    description?: string
  ): Omit<ParsedEntity, 'project_id'> {
    return {
      id,
      type: 'package',
      name,
      qualified_name: qualifiedName,
      source_file: sourceFile,
      description
    };
  }

  static createModule(
    id: string,
    name: string,
    qualifiedName: string,
    sourceFile: string,
    description?: string
  ): Omit<ParsedEntity, 'project_id'> {
    return {
      id,
      type: 'module',
      name,
      qualified_name: qualifiedName,
      source_file: sourceFile,
      description
    };
  }

  static createException(
    id: string,
    name: string,
    qualifiedName: string,
    sourceFile: string,
    startLine?: number,
    endLine?: number,
    modifiers?: string[],
    description?: string,
    annotations?: AnnotationInfo[]
  ): Omit<ParsedEntity, 'project_id'> {
    return {
      id,
      type: 'exception',
      name,
      qualified_name: qualifiedName,
      source_file: sourceFile,
      start_line: startLine,
      end_line: endLine,
      modifiers: modifiers || [],
      description,
      annotations: annotations || []
    };
  }
}