import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/types';
import { BaseAnnotationExtractor, AnnotationExtractionResult, ParsedAnnotationParameter } from '../base/AnnotationExtractor.js';
import { AnnotationInfo } from '../../../../types.js';

/**
 * TypeScript-specific annotation and decorator extraction
 */
export class TypeScriptAnnotationExtractor extends BaseAnnotationExtractor {

  extractAnnotations(
    content: string,
    entityPosition: number,
    astNode?: TSESTree.Node
  ): AnnotationExtractionResult {
    const errors: string[] = [];
    const annotations: AnnotationInfo[] = [];

    try {
      // If we have an AST node, extract decorators from it
      if (astNode && this.hasDecorators(astNode)) {
        const decorators = this.extractDecoratorsFromAST(astNode);
        annotations.push(...decorators);
      } else {
        // Fallback to text-based extraction
        const textDecorators = this.extractDecoratorsFromText(content, entityPosition);
        annotations.push(...textDecorators);
      }
    } catch (error) {
      errors.push(`Error extracting TypeScript annotations: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { annotations, errors };
  }

  private hasDecorators(node: any): boolean {
    return node.decorators && Array.isArray(node.decorators) && node.decorators.length > 0;
  }

  private extractDecoratorsFromAST(node: any): AnnotationInfo[] {
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
          framework: this.detectFramework(decoratorName),
          category: this.categorizeAnnotation(decoratorName)
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
            framework: this.detectFramework(decoratorInfo.name),
            category: this.categorizeAnnotation(decoratorInfo.name)
          });
        }
      }
    }
    
    return decorators;
  }

  private extractDecoratorsFromText(content: string, entityPosition: number): AnnotationInfo[] {
    const beforeEntity = content.substring(0, entityPosition);
    const lines = beforeEntity.split('\n');
    const decorators: AnnotationInfo[] = [];
    
    // Scan backwards from entity to find decorators
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (!line || this.isCommentLine(line)) {
        continue;
      }
      
      if (this.isAnnotationLine(line)) {
        // Found a decorator line
        const match = line.match(/@([A-Za-z_][A-Za-z0-9_.]*)(?:\(([^)]*)\))?/);
        if (match) {
          const decoratorName = match[1];
          const parametersString = match[2];
          
          decorators.unshift({
            name: `@${decoratorName}`,
            type: 'decorator',
            parameters: this.parseAnnotationParameters(parametersString),
            source_line: i + 1,
            framework: this.detectFramework(decoratorName),
            category: this.categorizeAnnotation(decoratorName)
          });
        }
      } else if (this.isDecoratorRelated(line)) {
        // This line is part of decorator parameters or metadata - continue scanning
        continue;
      } else {
        // Hit actual code content - stop scanning
        break;
      }
    }
    
    return decorators;
  }
  
  private isDecoratorRelated(line: string): boolean {
    // Check if this line looks like decorator parameters, properties, or metadata
    // This includes object properties, closing braces, array elements, etc.
    return line.includes(':') || line === '}' || line === '})' || line.includes(',') || 
           line.includes("'") || line.includes('"') || line.includes('[') || line.includes(']') ||
           /^\s*\w+\s*:/.test(line) || // property: value pattern
           /^['"].*['"]$/.test(line); // string value
  }

  private parseCallExpressionDecorator(expression: TSESTree.CallExpression): {name: string; parameters: ParsedAnnotationParameter[]} | null {
    if (expression.callee.type === AST_NODE_TYPES.Identifier) {
      const decoratorName = expression.callee.name;
      const parameters = this.extractDecoratorParametersFromAST(expression.arguments);
      
      return {
        name: decoratorName,
        parameters
      };
    }
    
    return null;
  }

  private extractDecoratorParametersFromAST(args: TSESTree.CallExpressionArgument[]): ParsedAnnotationParameter[] {
    const parameters: ParsedAnnotationParameter[] = [];
    
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

  parseAnnotationParameters(parametersString?: string): ParsedAnnotationParameter[] {
    if (!parametersString || !parametersString.trim()) {
      return [];
    }

    const params: ParsedAnnotationParameter[] = [];
    const paramString = parametersString.trim();
    
    // Handle object-like parameters
    if (paramString.startsWith('{') && paramString.endsWith('}')) {
      // Object parameters like { selector: 'app-test', template: '...' }
      const objectContent = paramString.slice(1, -1);
      const assignments = this.splitParameters(objectContent);
      
      for (const assignment of assignments) {
        const colonIndex = assignment.indexOf(':');
        if (colonIndex > 0) {
          const name = assignment.substring(0, colonIndex).trim();
          const value = assignment.substring(colonIndex + 1).trim();
          params.push({
            name: this.removeQuotes(name),
            value: this.removeQuotes(value),
            type: this.inferParameterType(value)
          });
        }
      }
    } else {
      // Simple parameters
      const values = this.splitParameters(paramString);
      for (const value of values) {
        params.push({
          value: this.removeQuotes(value.trim()),
          type: this.inferParameterType(value.trim())
        });
      }
    }
    
    return params;
  }

  detectFramework(decoratorName: string): string | undefined {
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

  categorizeAnnotation(decoratorName: string): string | undefined {
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

  protected isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
  }

  protected isAnnotationLine(line: string): boolean {
    return line.trim().startsWith('@');
  }
}