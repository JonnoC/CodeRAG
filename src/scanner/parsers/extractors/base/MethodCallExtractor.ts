export interface ParsedMethodCall {
  targetMethod: string;
  callType: 'instance' | 'static' | 'constructor' | 'function' | 'super';
  lineNumber: number;
  callerObject?: string;
  parameters?: string[];
  context?: 'assignment' | 'return' | 'parameter' | 'standalone';
}

export interface MethodCallExtractionResult {
  calls: ParsedMethodCall[];
  errors: string[];
}

export abstract class BaseMethodCallExtractor {
  abstract extractMethodCalls(
    methodBody: string, 
    methodName: string,
    className?: string,
    packageName?: string,
    imports?: Map<string, string>
  ): MethodCallExtractionResult;

  protected findLineNumber(content: string, searchText: string, startOffset: number = 0): number {
    const beforeOffset = content.substring(0, startOffset);
    const linesBeforeOffset = beforeOffset.split('\n').length - 1;
    
    const lines = content.substring(startOffset).split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return linesBeforeOffset + i + 1; // Line numbers are 1-based
      }
    }
    return linesBeforeOffset + 1;
  }

  protected removeCommentsAndStrings(line: string): string {
    // This is a base implementation - should be overridden by language-specific extractors
    return line;
  }

  protected isValidMethodCall(objectOrClass: string, method: string): boolean {
    // Base validation - can be overridden by language-specific extractors
    return objectOrClass.length > 0 && method.length > 0;
  }

  protected isValidFunctionCall(functionName: string): boolean {
    // Base validation - can be overridden by language-specific extractors
    return functionName.length > 0 && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(functionName);
  }

  protected isStaticCall(objectName: string): boolean {
    // Simple heuristic: starts with uppercase letter (can be overridden)
    return /^[A-Z]/.test(objectName);
  }

  protected resolveMethodCall(
    object: string, 
    method: string, 
    packageName?: string, 
    imports?: Map<string, string>
  ): string {
    // Basic resolution - can be enhanced by language-specific extractors
    return `${object}.${method}`;
  }

  protected resolveStaticMethodCall(
    className: string, 
    method: string, 
    packageName?: string, 
    imports?: Map<string, string>
  ): string {
    // Basic resolution - can be enhanced by language-specific extractors
    if (imports?.has(className)) {
      return `${imports.get(className)}.${method}`;
    }
    return packageName ? `${packageName}.${className}.${method}` : `${className}.${method}`;
  }

  protected resolveConstructorCall(
    className: string, 
    packageName?: string, 
    imports?: Map<string, string>
  ): string {
    // Basic resolution - can be enhanced by language-specific extractors
    if (imports?.has(className)) {
      return `${imports.get(className)}.<init>`;
    }
    return packageName ? `${packageName}.${className}.<init>` : `${className}.<init>`;
  }
}