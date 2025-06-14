import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/types';
import { 
  BaseMethodCallExtractor, 
  ParsedMethodCall, 
  MethodCallExtractionResult 
} from '../base/MethodCallExtractor.js';

export class TypeScriptMethodCallExtractor extends BaseMethodCallExtractor {
  extractMethodCalls(
    methodBody: string,
    methodName: string,
    className?: string,
    packageName?: string,
    imports?: Map<string, string>
  ): MethodCallExtractionResult {
    const calls: ParsedMethodCall[] = [];
    const errors: string[] = [];

    try {
      // For TypeScript, we can use AST-based extraction if we have the AST node
      // For now, we'll use regex-based extraction similar to Java but with TypeScript patterns
      const lines = methodBody.split('\n');

      lines.forEach((line, lineIndex) => {
        const cleanLine = this.removeCommentsAndStrings(line);
        
        // Extract method calls using TypeScript patterns
        calls.push(...this.extractInstanceCalls(cleanLine, lineIndex + 1, packageName, imports));
        calls.push(...this.extractStaticCalls(cleanLine, lineIndex + 1, packageName, imports));
        calls.push(...this.extractConstructorCalls(cleanLine, lineIndex + 1, packageName, imports));
        calls.push(...this.extractFunctionCalls(cleanLine, lineIndex + 1, className, methodName));
      });

    } catch (error) {
      errors.push(`Error extracting method calls: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { calls, errors };
  }

  extractMethodCallsFromAST(
    methodBody: TSESTree.BlockStatement,
    methodName: string,
    className?: string,
    packageName?: string,
    imports?: Map<string, string>
  ): MethodCallExtractionResult {
    const calls: ParsedMethodCall[] = [];
    const errors: string[] = [];

    try {
      this.visitASTNode(methodBody, calls, packageName, imports);
    } catch (error) {
      errors.push(`Error extracting method calls from AST: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { calls, errors };
  }

  private visitASTNode(
    node: TSESTree.Node, 
    calls: ParsedMethodCall[], 
    packageName?: string, 
    imports?: Map<string, string>
  ): void {
    switch (node.type) {
      case AST_NODE_TYPES.CallExpression:
        this.extractCallExpression(node, calls, packageName, imports);
        break;
      case AST_NODE_TYPES.NewExpression:
        this.extractNewExpression(node, calls, packageName, imports);
        break;
    }

    // Recursively visit child nodes
    for (const key in node) {
      const value = (node as any)[key];
      if (Array.isArray(value)) {
        value.forEach(child => {
          if (child && typeof child === 'object' && child.type) {
            this.visitASTNode(child, calls, packageName, imports);
          }
        });
      } else if (value && typeof value === 'object' && value.type) {
        this.visitASTNode(value, calls, packageName, imports);
      }
    }
  }

  private extractCallExpression(
    node: TSESTree.CallExpression, 
    calls: ParsedMethodCall[], 
    packageName?: string, 
    imports?: Map<string, string>
  ): void {
    const lineNumber = node.loc?.start.line || 0;

    if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
      // Method call: object.method() or Class.method()
      const object = this.getNodeName(node.callee.object);
      const method = this.getNodeName(node.callee.property);
      
      if (object && method && this.isValidMethodCall(object, method)) {
        const callType = this.isStaticCall(object) ? 'static' : 'instance';
        calls.push({
          targetMethod: this.resolveMethodCall(object, method, packageName, imports),
          callType,
          lineNumber,
          callerObject: object
        });
      }
    } else if (node.callee.type === AST_NODE_TYPES.Identifier) {
      // Function call: function()
      const functionName = node.callee.name;
      if (this.isValidFunctionCall(functionName)) {
        calls.push({
          targetMethod: functionName,
          callType: 'function',
          lineNumber
        });
      }
    }
  }

  private extractNewExpression(
    node: TSESTree.NewExpression, 
    calls: ParsedMethodCall[], 
    packageName?: string, 
    imports?: Map<string, string>
  ): void {
    const lineNumber = node.loc?.start.line || 0;
    const className = this.getNodeName(node.callee);
    
    if (className && this.isValidConstructor(className)) {
      calls.push({
        targetMethod: this.resolveConstructorCall(className, packageName, imports),
        callType: 'constructor',
        lineNumber,
        callerObject: className
      });
    }
  }

  private extractInstanceCalls(
    line: string, 
    lineNumber: number, 
    packageName?: string, 
    imports?: Map<string, string>
  ): ParsedMethodCall[] {
    const calls: ParsedMethodCall[] = [];
    const pattern = /(\w+)\.(\w+)\s*\(/g;
    let match;

    while ((match = pattern.exec(line)) !== null) {
      const object = match[1];
      const method = match[2];
      
      if (this.isValidMethodCall(object, method)) {
        calls.push({
          targetMethod: this.resolveMethodCall(object, method, packageName, imports),
          callType: 'instance',
          lineNumber,
          callerObject: object
        });
      }
    }

    return calls;
  }

  private extractStaticCalls(
    line: string, 
    lineNumber: number, 
    packageName?: string, 
    imports?: Map<string, string>
  ): ParsedMethodCall[] {
    const calls: ParsedMethodCall[] = [];
    const pattern = /([A-Z]\w*)\.(\w+)\s*\(/g;
    let match;

    while ((match = pattern.exec(line)) !== null) {
      const className = match[1];
      const method = match[2];
      
      if (this.isValidMethodCall(className, method)) {
        calls.push({
          targetMethod: this.resolveStaticMethodCall(className, method, packageName, imports),
          callType: 'static',
          lineNumber,
          callerObject: className
        });
      }
    }

    return calls;
  }

  private extractConstructorCalls(
    line: string, 
    lineNumber: number, 
    packageName?: string, 
    imports?: Map<string, string>
  ): ParsedMethodCall[] {
    const calls: ParsedMethodCall[] = [];
    const pattern = /new\s+([A-Z]\w*)\s*\(/g;
    let match;

    while ((match = pattern.exec(line)) !== null) {
      const className = match[1];
      
      if (this.isValidConstructor(className)) {
        calls.push({
          targetMethod: this.resolveConstructorCall(className, packageName, imports),
          callType: 'constructor',
          lineNumber,
          callerObject: className
        });
      }
    }

    return calls;
  }

  private extractFunctionCalls(
    line: string, 
    lineNumber: number, 
    className?: string,
    currentMethodName?: string
  ): ParsedMethodCall[] {
    const calls: ParsedMethodCall[] = [];
    const pattern = /(?:^|[^\w.])(\w+)\s*\(/g;
    let match;

    while ((match = pattern.exec(line)) !== null) {
      const functionName = match[1];
      
      // Skip the current method itself and common keywords
      if (functionName !== currentMethodName && this.isValidFunctionCall(functionName)) {
        const targetMethod = className ? `${className}.${functionName}` : functionName;
        calls.push({
          targetMethod,
          callType: 'function',
          lineNumber
        });
      }
    }

    return calls;
  }

  private getNodeName(node: TSESTree.Node | null): string | null {
    if (!node) return null;
    
    switch (node.type) {
      case AST_NODE_TYPES.Identifier:
        return node.name;
      case AST_NODE_TYPES.MemberExpression:
        const object = this.getNodeName(node.object);
        const property = this.getNodeName(node.property);
        return object && property ? `${object}.${property}` : null;
      default:
        return null;
    }
  }

  protected removeCommentsAndStrings(line: string): string {
    let result = line;
    
    // Remove string literals
    result = result.replace(/"([^"\\]|\\.)*"/g, '""');
    result = result.replace(/'([^'\\]|\\.)*'/g, "''");
    result = result.replace(/`([^`\\]|\\.)*`/g, '``'); // Template literals
    
    // Remove line comments
    const commentIndex = result.indexOf('//');
    if (commentIndex !== -1) {
      result = result.substring(0, commentIndex);
    }
    
    return result;
  }

  protected isValidMethodCall(object: string, method: string): boolean {
    // Skip common false positives
    const skipObjects = ['console', 'window', 'document', 'JSON', 'Math', 'Object', 'Array'];
    const skipMethods = ['log', 'error', 'warn', 'info', 'debug'];
    
    return !skipObjects.includes(object) || !skipMethods.includes(method);
  }

  protected isValidFunctionCall(functionName: string): boolean {
    // Skip common built-in functions and keywords
    const skipFunctions = ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 
                          'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'require', 'import',
                          'if', 'for', 'while', 'switch', 'try', 'catch', 'finally', 'return', 'throw'];
    
    return !skipFunctions.includes(functionName);
  }

  private isValidConstructor(className: string): boolean {
    // Skip common built-in types
    const builtinTypes = ['Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Error', 'Promise'];
    return !builtinTypes.includes(className);
  }

  protected resolveMethodCall(
    object: string, 
    method: string, 
    packageName?: string, 
    imports?: Map<string, string>
  ): string {
    // Enhanced resolution for TypeScript/JavaScript
    if (object === 'this') {
      return packageName ? `${packageName}.${method}` : method;
    }
    
    return `${object}.${method}`;
  }

  protected resolveConstructorCall(
    className: string, 
    packageName?: string, 
    imports?: Map<string, string>
  ): string {
    // Check imports first
    if (imports?.has(className)) {
      return `${imports.get(className)}.constructor`;
    }
    
    // Use package name if available
    return packageName ? `${packageName}.${className}.constructor` : `${className}.constructor`;
  }
}