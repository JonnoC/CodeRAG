import * as path from 'path';
import { parse } from '@typescript-eslint/parser';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/types';
import { 
  BaseContentExtractor, 
  ContentExtractionResult, 
  ParsedClass, 
  ParsedInterface, 
  ParsedMethod, 
  ParsedField, 
  ParsedEnum, 
  ParsedImport,
  ParsedParameter 
} from '../base/ContentExtractor.js';

export class TypeScriptContentExtractor extends BaseContentExtractor {
  extractContent(content: string, filePath: string): ContentExtractionResult {
    const result: ContentExtractionResult = {
      moduleName: this.getModuleFromPath(filePath),
      imports: [],
      classes: [],
      interfaces: [],
      enums: [],
      functions: [],
      fields: [],
      exceptions: []
    };

    try {
      const ast = parse(content, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
          globalReturn: false,
        },
        loc: true,
        range: true,
      });

      this.visitNode(ast, result, content);
      
      // Separate exceptions from regular classes
      result.exceptions = result.classes.filter(cls => 
        cls.extends?.some(parent => parent.includes('Error')) ||
        cls.name.endsWith('Error')
      );

    } catch (error) {
      console.warn(`Failed to parse TypeScript file ${filePath}:`, error);
    }

    return result;
  }

  private visitNode(node: any, result: ContentExtractionResult, content: string): void {
    if (!node || typeof node !== 'object') return;

    switch (node.type) {
      case AST_NODE_TYPES.ImportDeclaration:
        result.imports.push(this.handleImportDeclaration(node));
        break;
      case AST_NODE_TYPES.ClassDeclaration:
        if (node.id?.name) {
          result.classes.push(this.handleClassDeclaration(node, content));
        }
        break;
      case AST_NODE_TYPES.TSInterfaceDeclaration:
        result.interfaces.push(this.handleInterfaceDeclaration(node, content));
        break;
      case AST_NODE_TYPES.TSEnumDeclaration:
        result.enums.push(this.handleEnumDeclaration(node, content));
        break;
      case AST_NODE_TYPES.FunctionDeclaration:
        if (node.id?.name) {
          result.functions.push(this.handleFunctionDeclaration(node, content));
        }
        break;
      case AST_NODE_TYPES.VariableDeclaration:
        result.fields.push(...this.handleVariableDeclaration(node, content));
        break;
    }

    // Recursively visit child nodes
    for (const key in node) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          this.visitNode(item, result, content);
        }
      } else if (typeof child === 'object' && child !== null) {
        this.visitNode(child, result, content);
      }
    }
  }

  private handleImportDeclaration(node: TSESTree.ImportDeclaration): ParsedImport {
    const source = node.source.value as string;
    const items: string[] = [];
    let isDefault = false;

    if (node.specifiers) {
      for (const specifier of node.specifiers) {
        switch (specifier.type) {
          case AST_NODE_TYPES.ImportDefaultSpecifier:
            items.push(specifier.local.name);
            isDefault = true;
            break;
          case AST_NODE_TYPES.ImportSpecifier:
            items.push(specifier.imported.name);
            break;
          case AST_NODE_TYPES.ImportNamespaceSpecifier:
            items.push('*');
            break;
        }
      }
    }

    return {
      module: source,
      items,
      isDefault
    };
  }

  private handleClassDeclaration(node: TSESTree.ClassDeclaration, content: string): ParsedClass {
    const className = node.id?.name || 'Anonymous';
    const modifiers = this.extractModifiers(node);
    const location = this.getLocation(node);

    const parsedClass: ParsedClass = {
      name: className,
      modifiers,
      startLine: location.start,
      endLine: location.end
    };

    // Handle inheritance
    if (node.superClass) {
      if (node.superClass.type === AST_NODE_TYPES.Identifier) {
        parsedClass.extends = [node.superClass.name];
      }
    }

    // Handle implements
    if (node.implements) {
      parsedClass.implements = node.implements.map(impl => {
        if (impl.expression.type === AST_NODE_TYPES.Identifier) {
          return impl.expression.name;
        }
        return 'Unknown';
      });
    }

    return parsedClass;
  }

  private handleInterfaceDeclaration(node: TSESTree.TSInterfaceDeclaration, content: string): ParsedInterface {
    const interfaceName = node.id.name;
    const modifiers = this.extractModifiers(node);
    const location = this.getLocation(node);

    const parsedInterface: ParsedInterface = {
      name: interfaceName,
      modifiers,
      startLine: location.start,
      endLine: location.end
    };

    // Handle extends
    if (node.extends) {
      parsedInterface.extends = node.extends.map(extend => {
        if (extend.expression.type === AST_NODE_TYPES.Identifier) {
          return extend.expression.name;
        }
        return 'Unknown';
      });
    }

    return parsedInterface;
  }

  private handleEnumDeclaration(node: TSESTree.TSEnumDeclaration, content: string): ParsedEnum {
    const enumName = node.id.name;
    const modifiers = this.extractModifiers(node);
    const location = this.getLocation(node);

    const values = node.members.map(member => {
      if (member.id.type === AST_NODE_TYPES.Identifier) {
        return member.id.name;
      }
      return 'Unknown';
    });

    return {
      name: enumName,
      values,
      modifiers,
      startLine: location.start,
      endLine: location.end
    };
  }

  private handleFunctionDeclaration(node: TSESTree.FunctionDeclaration, content: string): ParsedMethod {
    const functionName = node.id?.name || 'Anonymous';
    const modifiers = this.extractModifiers(node);
    const location = this.getLocation(node);
    const parameters = this.extractParameters(node.params);

    let returnType: string | undefined;
    if (node.returnType) {
      returnType = this.getTypeAnnotation(node.returnType);
    }

    return {
      name: functionName,
      parameters,
      returnType,
      modifiers,
      startLine: location.start,
      endLine: location.end
    };
  }

  private handleVariableDeclaration(node: TSESTree.VariableDeclaration, content: string): ParsedField[] {
    const fields: ParsedField[] = [];
    const location = this.getLocation(node);

    for (const declarator of node.declarations) {
      if (declarator.id.type === AST_NODE_TYPES.Identifier) {
        const fieldName = declarator.id.name;
        let type: string | undefined;

        if (declarator.id.typeAnnotation) {
          type = this.getTypeAnnotation(declarator.id.typeAnnotation);
        }

        fields.push({
          name: fieldName,
          type,
          modifiers: [node.kind], // var, let, const
          startLine: location.start,
          endLine: location.end
        });
      }
    }

    return fields;
  }

  private extractModifiers(node: any): string[] {
    const modifiers: string[] = [];

    if (node.accessibility) {
      modifiers.push(node.accessibility);
    }

    if (node.static) {
      modifiers.push('static');
    }

    if (node.readonly) {
      modifiers.push('readonly');
    }

    if (node.abstract) {
      modifiers.push('abstract');
    }

    if (node.async) {
      modifiers.push('async');
    }

    if (node.export) {
      modifiers.push('export');
    }

    return modifiers;
  }

  private extractParameters(params: TSESTree.Parameter[]): ParsedParameter[] {
    return params.map(param => this.parseParameterFromAst(param)).filter(Boolean) as ParsedParameter[];
  }

  private parseParameterFromAst(param: TSESTree.Parameter): ParsedParameter | null {
    if (param.type === AST_NODE_TYPES.Identifier) {
      const name = param.name;
      let type: string | undefined;
      let isOptional = false;

      if (param.typeAnnotation) {
        type = this.getTypeAnnotation(param.typeAnnotation);
      }

      if (param.optional) {
        isOptional = true;
      }

      return {
        name,
        type,
        isOptional
      };
    }

    return null;
  }

  protected parseParameter(param: string): ParsedParameter | null {
    // This method is used by the base class but we override parameter parsing
    // for TypeScript since we use AST-based parsing
    const trimmed = param.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(':');
    const name = parts[0].trim();
    const type = parts[1]?.trim();

    return {
      name,
      type,
      isOptional: name.endsWith('?')
    };
  }

  private getTypeAnnotation(typeAnnotation: any): string {
    if (!typeAnnotation || !typeAnnotation.typeAnnotation) {
      return 'unknown';
    }

    const type = typeAnnotation.typeAnnotation;
    
    switch (type.type) {
      case AST_NODE_TYPES.TSStringKeyword:
        return 'string';
      case AST_NODE_TYPES.TSNumberKeyword:
        return 'number';
      case AST_NODE_TYPES.TSBooleanKeyword:
        return 'boolean';
      case AST_NODE_TYPES.TSVoidKeyword:
        return 'void';
      case AST_NODE_TYPES.TSAnyKeyword:
        return 'any';
      case AST_NODE_TYPES.TSTypeReference:
        if (type.typeName.type === AST_NODE_TYPES.Identifier) {
          return type.typeName.name;
        }
        return 'unknown';
      default:
        return 'unknown';
    }
  }

  private getLocation(node: any): { start: number; end: number } {
    return {
      start: node.loc?.start?.line || 1,
      end: node.loc?.end?.line || 1
    };
  }

  private getModuleFromPath(filePath: string): string {
    const parsed = path.parse(filePath);
    return parsed.name;
  }
}