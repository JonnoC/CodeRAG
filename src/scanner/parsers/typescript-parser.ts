import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@typescript-eslint/parser';
import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/types';
import { LanguageParser, ParsedEntity, ParsedRelationship, ParseError } from '../types.js';
import { AnnotationInfo } from '../../types.js';

export class TypeScriptParser implements LanguageParser {
  private currentProjectId: string = '';

  canParse(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx';
  }

  private addEntity(entities: ParsedEntity[], entity: Omit<ParsedEntity, 'project_id'>): void {
    entities.push({
      ...entity,
      project_id: this.currentProjectId
    });
  }

  private addRelationship(relationships: ParsedRelationship[], relationship: Omit<ParsedRelationship, 'project_id'>): void {
    relationships.push({
      ...relationship,
      project_id: this.currentProjectId
    });
  }

  async parseFile(filePath: string, content: string, projectId: string): Promise<{
    entities: ParsedEntity[];
    relationships: ParsedRelationship[];
    errors: ParseError[];
  }> {
    this.currentProjectId = projectId;
    const entities: ParsedEntity[] = [];
    const relationships: ParsedRelationship[] = [];
    const errors: ParseError[] = [];

    try {
      // Parse the file into an AST
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

      // Get the module/package name from file path
      const packageName = this.getPackageFromPath(filePath);
      const packageId = packageName;

      // Add package/module entity if not root
      if (packageName !== 'root') {
        this.addEntity(entities, {
          id: packageId,
          type: 'module',
          name: packageName,
          qualified_name: packageName,
          source_file: path.dirname(filePath),
          description: `Module: ${packageName}`
        });
      }

      // Visit all nodes in the AST
      this.visitNode(ast, entities, relationships, filePath, packageId, errors);

    } catch (error) {
      errors.push({
        file: filePath,
        message: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
    }

    return { entities, relationships, errors };
  }

  private visitNode(
    node: TSESTree.Node,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    packageId: string,
    errors: ParseError[]
  ): void {
    switch (node.type) {
      case AST_NODE_TYPES.ClassDeclaration:
        this.handleClassDeclaration(node, entities, relationships, filePath, packageId);
        break;
      case AST_NODE_TYPES.TSInterfaceDeclaration:
        this.handleInterfaceDeclaration(node, entities, relationships, filePath, packageId);
        break;
      case AST_NODE_TYPES.TSEnumDeclaration:
        this.handleEnumDeclaration(node, entities, relationships, filePath, packageId);
        break;
      case AST_NODE_TYPES.FunctionDeclaration:
        this.handleFunctionDeclaration(node, entities, relationships, filePath, packageId);
        break;
      case AST_NODE_TYPES.TSModuleDeclaration:
        this.handleModuleDeclaration(node, entities, relationships, filePath, packageId);
        break;
    }

    // Recursively visit child nodes
    if (node.type === AST_NODE_TYPES.Program) {
      for (const child of node.body) {
        this.visitNode(child, entities, relationships, filePath, packageId, errors);
      }
    } else {
      this.visitChildNodes(node, entities, relationships, filePath, packageId, errors);
    }
  }

  private handleClassDeclaration(
    node: TSESTree.ClassDeclaration,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    packageId: string
  ): void {
    if (!node.id) return;

    const className = node.id.name;
    const qualifiedName = `${this.getPackageFromPath(filePath)}.${className}`;
    const classId = qualifiedName;

    // Extract modifiers
    const modifiers: string[] = [];
    if (node.abstract) modifiers.push('abstract');

    // Extract JSDoc comment
    const description = this.extractJSDoc(node);
    
    // Extract decorators
    const annotations = this.extractDecorators(node);

    // Create class entity
    const classEntity: ParsedEntity = {
      id: classId,
      project_id: this.currentProjectId,
      type: 'class',
      name: className,
      qualified_name: qualifiedName,
      description,
      source_file: filePath,
      start_line: node.loc?.start.line,
      end_line: node.loc?.end.line,
      modifiers,
      attributes: {
        implements: [],
        extends: undefined,
        annotations
      }
    };

    // Handle inheritance
    if (node.superClass && node.superClass.type === AST_NODE_TYPES.Identifier) {
      const parentName = node.superClass.name;
      const parentId = `${this.getPackageFromPath(filePath)}.${parentName}`;
      classEntity.attributes!.extends = parentId;

      // Create extends relationship
      this.addRelationship(relationships, {
        id: `${classId}_extends_${parentId}`,
        type: 'extends',
        source: classId,
        target: parentId
      });
    }

    // Handle implemented interfaces
    if (node.implements) {
      for (const impl of node.implements) {
        if (impl.expression.type === AST_NODE_TYPES.Identifier) {
          const interfaceName = impl.expression.name;
          const interfaceId = `${this.getPackageFromPath(filePath)}.${interfaceName}`;
          classEntity.attributes!.implements!.push(interfaceId);

          // Create implements relationship
          this.addRelationship(relationships, {
            id: `${classId}_implements_${interfaceId}`,
            type: 'implements',
            source: classId,
            target: interfaceId
          });
        }
      }
    }

    this.addEntity(entities, classEntity);

    // Create belongs_to relationship with package
    if (packageId !== 'root') {
      this.addRelationship(relationships, {
        id: `${classId}_belongs_to_${packageId}`,
        type: 'belongs_to',
        source: classId,
        target: packageId
      });
    }

    // Handle class members
    for (const member of node.body.body) {
      this.handleClassMember(member, classId, entities, relationships, filePath);
    }
  }

  private handleInterfaceDeclaration(
    node: TSESTree.TSInterfaceDeclaration,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    packageId: string
  ): void {
    const interfaceName = node.id.name;
    const qualifiedName = `${this.getPackageFromPath(filePath)}.${interfaceName}`;
    const interfaceId = qualifiedName;

    const description = this.extractJSDoc(node);
    const annotations = this.extractDecorators(node);

    const interfaceEntity: ParsedEntity = {
      id: interfaceId,
      project_id: this.currentProjectId,
      type: 'interface',
      name: interfaceName,
      qualified_name: qualifiedName,
      description,
      source_file: filePath,
      start_line: node.loc?.start.line,
      end_line: node.loc?.end.line,
      attributes: {
        extends: undefined,
        annotations
      }
    };

    // Handle interface inheritance
    if (node.extends) {
      for (const ext of node.extends) {
        if (ext.expression.type === AST_NODE_TYPES.Identifier) {
          const parentName = ext.expression.name;
          const parentId = `${this.getPackageFromPath(filePath)}.${parentName}`;
          
          this.addRelationship(relationships, {
            id: `${interfaceId}_extends_${parentId}`,
            type: 'extends',
            source: interfaceId,
            target: parentId
          });
        }
      }
    }

    this.addEntity(entities, interfaceEntity);

    // Create belongs_to relationship
    if (packageId !== 'root') {
      this.addRelationship(relationships, {
        id: `${interfaceId}_belongs_to_${packageId}`,
        type: 'belongs_to',
        source: interfaceId,
        target: packageId
      });
    }

    // Handle interface members
    for (const member of node.body.body) {
      if (member.type === AST_NODE_TYPES.TSMethodSignature || 
          member.type === AST_NODE_TYPES.TSPropertySignature) {
        this.handleInterfaceMember(member, interfaceId, entities, relationships, filePath);
      }
    }
  }

  private handleEnumDeclaration(
    node: TSESTree.TSEnumDeclaration,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    packageId: string
  ): void {
    const enumName = node.id.name;
    const qualifiedName = `${this.getPackageFromPath(filePath)}.${enumName}`;
    const enumId = qualifiedName;

    const description = this.extractJSDoc(node);
    const annotations = this.extractDecorators(node);

    this.addEntity(entities, {
      id: enumId,
      type: 'enum',
      name: enumName,
      qualified_name: qualifiedName,
      description,
      source_file: filePath,
      start_line: node.loc?.start.line,
      end_line: node.loc?.end.line,
      attributes: {
        annotations
      }
    });

    // Create belongs_to relationship
    if (packageId !== 'root') {
      this.addRelationship(relationships, {
        id: `${enumId}_belongs_to_${packageId}`,
        type: 'belongs_to',
        source: enumId,
        target: packageId
      });
    }
  }

  private handleFunctionDeclaration(
    node: TSESTree.FunctionDeclaration,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    packageId: string
  ): void {
    if (!node.id) return;

    const functionName = node.id.name;
    const qualifiedName = `${this.getPackageFromPath(filePath)}.${functionName}`;
    const functionId = qualifiedName;

    const description = this.extractJSDoc(node);
    const parameters = this.extractParameters(node.params);
    const returnType = this.extractReturnType(node);
    const annotations = this.extractDecorators(node);

    this.addEntity(entities, {
      id: functionId,
      type: 'function',
      name: functionName,
      qualified_name: qualifiedName,
      description,
      source_file: filePath,
      start_line: node.loc?.start.line,
      end_line: node.loc?.end.line,
      attributes: {
        parameters,
        return_type: returnType,
        annotations
      }
    });

    // Create belongs_to relationship
    if (packageId !== 'root') {
      this.addRelationship(relationships, {
        id: `${functionId}_belongs_to_${packageId}`,
        type: 'belongs_to',
        source: functionId,
        target: packageId
      });
    }
  }

  private handleModuleDeclaration(
    node: TSESTree.TSModuleDeclaration,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    packageId: string
  ): void {
    if (node.id.type === AST_NODE_TYPES.Identifier) {
      const moduleName = node.id.name;
      const qualifiedName = `${this.getPackageFromPath(filePath)}.${moduleName}`;
      const moduleId = qualifiedName;

      this.addEntity(entities, {
        id: moduleId,
        type: 'module',
        name: moduleName,
        qualified_name: qualifiedName,
        source_file: filePath,
        start_line: node.loc?.start.line,
        end_line: node.loc?.end.line
      });

      // Create belongs_to relationship
      if (packageId !== 'root') {
        this.addRelationship(relationships, {
          id: `${moduleId}_belongs_to_${packageId}`,
          type: 'belongs_to',
          source: moduleId,
          target: packageId
        });
      }
    }
  }

  private handleClassMember(
    member: TSESTree.ClassElement,
    classId: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string
  ): void {
    switch (member.type) {
      case AST_NODE_TYPES.MethodDefinition:
        this.handleMethod(member, classId, entities, relationships, filePath);
        break;
      case AST_NODE_TYPES.PropertyDefinition:
        this.handleProperty(member, classId, entities, relationships, filePath);
        break;
    }
  }

  private handleMethod(
    method: TSESTree.MethodDefinition,
    classId: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string
  ): void {
    if (method.key.type !== AST_NODE_TYPES.Identifier) return;

    const methodName = method.key.name;
    const methodId = `${classId}.${methodName}`;

    const modifiers: string[] = [];
    if (method.static) modifiers.push('static');
    if (method.accessibility) modifiers.push(method.accessibility);

    const description = this.extractJSDoc(method);
    const parameters = method.value.params ? this.extractParameters(method.value.params) : [];
    // Simplified return type extraction
    const returnType = 'any'; // Would need more complex type analysis for proper return types
    const annotations = this.extractDecorators(method);

    this.addEntity(entities, {
      id: methodId,
      type: 'method',
      name: methodName,
      qualified_name: methodId,
      description,
      source_file: filePath,
      start_line: method.loc?.start.line,
      end_line: method.loc?.end.line,
      modifiers,
      attributes: {
        parameters,
        return_type: returnType,
        annotations
      }
    });

    // Create contains relationship
    this.addRelationship(relationships, {
      id: `${classId}_contains_${methodId}`,
      type: 'contains',
      source: classId,
      target: methodId
    });
  }

  private handleProperty(
    property: TSESTree.PropertyDefinition,
    classId: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string
  ): void {
    if (property.key.type !== AST_NODE_TYPES.Identifier) return;

    const propertyName = property.key.name;
    const propertyId = `${classId}.${propertyName}`;

    const modifiers: string[] = [];
    if (property.static) modifiers.push('static');
    if (property.accessibility) modifiers.push(property.accessibility);
    
    const annotations = this.extractDecorators(property);

    this.addEntity(entities, {
      id: propertyId,
      type: 'field',
      name: propertyName,
      qualified_name: propertyId,
      source_file: filePath,
      start_line: property.loc?.start.line,
      end_line: property.loc?.end.line,
      modifiers,
      attributes: {
        annotations
      }
    });

    // Create contains relationship
    this.addRelationship(relationships, {
      id: `${classId}_contains_${propertyId}`,
      type: 'contains',
      source: classId,
      target: propertyId
    });
  }

  private handleInterfaceMember(
    member: TSESTree.TSMethodSignature | TSESTree.TSPropertySignature,
    interfaceId: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string
  ): void {
    if (member.key.type !== AST_NODE_TYPES.Identifier) return;

    const memberName = member.key.name;
    const memberId = `${interfaceId}.${memberName}`;
    const memberType = member.type === AST_NODE_TYPES.TSMethodSignature ? 'method' : 'field';

    let parameters: any[] = [];
    let returnType: string | undefined;

    if (member.type === AST_NODE_TYPES.TSMethodSignature && member.params) {
      parameters = this.extractParameters(member.params);
    }

    this.addEntity(entities, {
      id: memberId,
      type: memberType,
      name: memberName,
      qualified_name: memberId,
      source_file: filePath,
      start_line: member.loc?.start.line,
      end_line: member.loc?.end.line,
      attributes: {
        parameters,
        return_type: returnType
      }
    });

    // Create contains relationship
    this.addRelationship(relationships, {
      id: `${interfaceId}_contains_${memberId}`,
      type: 'contains',
      source: interfaceId,
      target: memberId
    });
  }

  private visitChildNodes(
    node: TSESTree.Node,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    packageId: string,
    errors: ParseError[]
  ): void {
    // This is a simplified version - in a full implementation,
    // we would recursively visit all child nodes
    for (const key in node) {
      const value = (node as any)[key];
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object' && item.type) {
            this.visitNode(item, entities, relationships, filePath, packageId, errors);
          }
        }
      } else if (value && typeof value === 'object' && value.type) {
        this.visitNode(value, entities, relationships, filePath, packageId, errors);
      }
    }
  }

  private extractJSDoc(node: any): string | undefined {
    // Extract JSDoc comments - simplified implementation
    // In a real implementation, we would parse leading comments
    return undefined;
  }

  private extractParameters(params: TSESTree.Parameter[]): Array<{name: string; type: string; description?: string}> {
    return params.map(param => {
      let name = 'unknown';
      if (param.type === AST_NODE_TYPES.Identifier) {
        name = param.name;
      }
      return {
        name,
        type: 'any', // Type inference would be more complex
        description: undefined
      };
    });
  }

  private extractReturnType(node: TSESTree.FunctionExpression | TSESTree.FunctionDeclaration | TSESTree.ArrowFunctionExpression): string | undefined {
    // Simplified - would need proper type analysis
    return 'any';
  }

  private getPackageFromPath(filePath: string): string {
    const pathParts = path.dirname(filePath).split(path.sep);
    const srcIndex = pathParts.findIndex(part => part === 'src');
    
    if (srcIndex >= 0 && srcIndex < pathParts.length - 1) {
      return pathParts.slice(srcIndex + 1).join('.');
    }
    
    return 'root';
  }

  private extractDecorators(node: any): AnnotationInfo[] {
    if (!node.decorators || !Array.isArray(node.decorators)) {
      return [];
    }

    const decorators: AnnotationInfo[] = [];
    
    for (const decorator of node.decorators) {
      if (decorator.expression.type === AST_NODE_TYPES.Identifier) {
        // Simple decorator like @Component
        const decoratorName = decorator.expression.name;
        decorators.push({
          name: `@${decoratorName}`,
          type: 'decorator',
          source_line: decorator.loc?.start.line,
          framework: this.detectTypeScriptFramework(decoratorName),
          category: this.categorizeDecorator(decoratorName)
        });
      } else if (decorator.expression.type === AST_NODE_TYPES.CallExpression) {
        // Decorator with parameters like @Component({...})
        const decoratorInfo = this.parseCallExpressionDecorator(decorator.expression);
        if (decoratorInfo) {
          decorators.push({
            name: `@${decoratorInfo.name}`,
            type: 'decorator',
            parameters: decoratorInfo.parameters,
            source_line: decorator.loc?.start.line,
            framework: this.detectTypeScriptFramework(decoratorInfo.name),
            category: this.categorizeDecorator(decoratorInfo.name)
          });
        }
      }
    }
    
    return decorators;
  }

  private parseCallExpressionDecorator(expression: TSESTree.CallExpression): {name: string; parameters: Array<{name?: string; value: string; type?: string}>} | null {
    if (expression.callee.type === AST_NODE_TYPES.Identifier) {
      const decoratorName = expression.callee.name;
      const parameters = this.extractDecoratorParameters(expression.arguments);
      
      return {
        name: decoratorName,
        parameters
      };
    }
    
    return null;
  }

  private extractDecoratorParameters(args: TSESTree.CallExpressionArgument[]): Array<{name?: string; value: string; type?: string}> {
    const parameters: Array<{name?: string; value: string; type?: string}> = [];
    
    for (const arg of args) {
      if (arg.type === AST_NODE_TYPES.ObjectExpression) {
        // Handle object parameters like @Component({ selector: 'app-test', template: '...' })
        for (const property of arg.properties) {
          if (property.type === AST_NODE_TYPES.Property && 
              property.key.type === AST_NODE_TYPES.Identifier &&
              property.value.type === AST_NODE_TYPES.Literal) {
            parameters.push({
              name: property.key.name,
              value: String(property.value.value),
              type: typeof property.value.value
            });
          }
        }
      } else if (arg.type === AST_NODE_TYPES.Literal) {
        // Handle simple parameters like @Injectable('service')
        parameters.push({
          value: String(arg.value),
          type: typeof arg.value
        });
      } else if (arg.type === AST_NODE_TYPES.Identifier) {
        // Handle identifier parameters
        parameters.push({
          value: arg.name,
          type: 'identifier'
        });
      }
    }
    
    return parameters;
  }

  private detectTypeScriptFramework(decoratorName: string): string | undefined {
    const frameworkMap: Record<string, string> = {
      // Angular
      'Component': 'Angular',
      'Injectable': 'Angular',
      'NgModule': 'Angular',
      'Directive': 'Angular',
      'Pipe': 'Angular',
      'Input': 'Angular',
      'Output': 'Angular',
      'ViewChild': 'Angular',
      'ViewChildren': 'Angular',
      'ContentChild': 'Angular',
      'ContentChildren': 'Angular',
      'HostBinding': 'Angular',
      'HostListener': 'Angular',
      
      // NestJS
      'Controller': 'NestJS',
      'Service': 'NestJS',
      'Module': 'NestJS',
      'Get': 'NestJS',
      'Post': 'NestJS',
      'Put': 'NestJS',
      'Delete': 'NestJS',
      'Patch': 'NestJS',
      'Body': 'NestJS',
      'Param': 'NestJS',
      'Query': 'NestJS',
      'Headers': 'NestJS',
      'Req': 'NestJS',
      'Res': 'NestJS',
      'Guard': 'NestJS',
      'UseGuards': 'NestJS',
      'UseFilters': 'NestJS',
      'UseInterceptors': 'NestJS',
      'UsePipes': 'NestJS',
      
      // TypeORM
      'Entity': 'TypeORM',
      'Column': 'TypeORM',
      'PrimaryGeneratedColumn': 'TypeORM',
      'PrimaryColumn': 'TypeORM',
      'OneToMany': 'TypeORM',
      'ManyToOne': 'TypeORM',
      'ManyToMany': 'TypeORM',
      'OneToOne': 'TypeORM',
      'JoinColumn': 'TypeORM',
      'JoinTable': 'TypeORM',
      'Repository': 'TypeORM',
      
      // React
      'memo': 'React',
      'forwardRef': 'React',
      'useState': 'React',
      'useEffect': 'React',
      'useContext': 'React',
      'useReducer': 'React',
      'useCallback': 'React',
      'useMemo': 'React',
      
      // MobX
      'observable': 'MobX',
      'action': 'MobX',
      'computed': 'MobX',
      'observer': 'MobX',
      
      // Inversify
      'injectable': 'Inversify',
      'inject': 'Inversify',
      'named': 'Inversify',
      'tagged': 'Inversify',
      'multiInject': 'Inversify',
      'optional': 'Inversify',
      
      // TypeScript Experimental
      'sealed': 'TypeScript',
      'enumerable': 'TypeScript',
      'override': 'TypeScript',
      'deprecated': 'TypeScript'
    };
    
    return frameworkMap[decoratorName];
  }

  private categorizeDecorator(decoratorName: string): string | undefined {
    const categoryMap: Record<string, string> = {
      // Component/UI
      'Component': 'ui',
      'Directive': 'ui',
      'Pipe': 'ui',
      'NgModule': 'ui',
      'memo': 'ui',
      'forwardRef': 'ui',
      
      // Dependency Injection
      'Injectable': 'injection',
      'Service': 'injection',
      'inject': 'injection',
      'injectable': 'injection',
      'Module': 'injection',
      
      // HTTP/API
      'Controller': 'web',
      'Get': 'web',
      'Post': 'web',
      'Put': 'web',
      'Delete': 'web',
      'Patch': 'web',
      'Body': 'web',
      'Param': 'web',
      'Query': 'web',
      'Headers': 'web',
      'Req': 'web',
      'Res': 'web',
      
      // Data/Persistence
      'Entity': 'persistence',
      'Column': 'persistence',
      'PrimaryGeneratedColumn': 'persistence',
      'PrimaryColumn': 'persistence',
      'OneToMany': 'persistence',
      'ManyToOne': 'persistence',
      'ManyToMany': 'persistence',
      'OneToOne': 'persistence',
      'JoinColumn': 'persistence',
      'JoinTable': 'persistence',
      'Repository': 'persistence',
      
      // Event Handling
      'Input': 'events',
      'Output': 'events',
      'HostListener': 'events',
      'HostBinding': 'events',
      'ViewChild': 'events',
      'ViewChildren': 'events',
      'ContentChild': 'events',
      'ContentChildren': 'events',
      
      // State Management
      'observable': 'state',
      'action': 'state',
      'computed': 'state',
      'observer': 'state',
      'useState': 'state',
      'useReducer': 'state',
      'useContext': 'state',
      
      // Performance
      'useCallback': 'performance',
      'useMemo': 'performance',
      'useEffect': 'lifecycle',
      
      // Security/Guards
      'Guard': 'security',
      'UseGuards': 'security',
      'UseFilters': 'security',
      'UseInterceptors': 'security',
      'UsePipes': 'security',
      
      // Language Features
      'override': 'language',
      'deprecated': 'language',
      'sealed': 'language',
      'enumerable': 'language'
    };
    
    return categoryMap[decoratorName];
  }
}