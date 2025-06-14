import { BaseAnnotationExtractor, AnnotationExtractionResult, ParsedAnnotationParameter } from '../base/AnnotationExtractor.js';
import { AnnotationInfo } from '../../../../types.js';

/**
 * Python-specific decorator extraction
 */
export class PythonAnnotationExtractor extends BaseAnnotationExtractor {

  extractAnnotations(
    content: string,
    entityPosition: number
  ): AnnotationExtractionResult {
    const errors: string[] = [];
    const annotations: AnnotationInfo[] = [];

    try {
      const beforeEntity = content.substring(0, entityPosition);
      const lines = beforeEntity.split('\n');
      
      // Scan backwards from entity to find decorators
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        
        if (this.isAnnotationLine(line)) {
          const match = line.match(/@([A-Za-z_][A-Za-z0-9_.]*)(?:\(([^)]*)\))?/);
          if (match) {
            const decoratorName = match[1];
            const parametersString = match[2];
            
            annotations.unshift({
              name: decoratorName,
              type: 'decorator',
              parameters: this.parseAnnotationParameters(parametersString),
              source_line: i + 1,
              framework: this.detectFramework(decoratorName),
              category: this.categorizeAnnotation(decoratorName)
            });
          }
        } else if (line && !this.isCommentLine(line)) {
          // Stop on non-comment, non-decorator content
          break;
        }
      }
    } catch (error) {
      errors.push(`Error extracting Python decorators: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { annotations, errors };
  }

  parseAnnotationParameters(parametersString?: string): ParsedAnnotationParameter[] {
    if (!parametersString || !parametersString.trim()) {
      return [];
    }
    
    const params: ParsedAnnotationParameter[] = [];
    const paramString = parametersString.trim();
    
    // Handle different parameter patterns
    if (paramString.includes('=')) {
      // Named parameters like @decorator(param1=value1, param2=value2)
      const assignments = this.splitParameters(paramString);
      for (const assignment of assignments) {
        const parts = assignment.split('=').map(p => p.trim());
        if (parts.length === 2) {
          params.push({
            name: parts[0],
            value: this.removeQuotes(parts[1]),
            type: this.inferParameterType(parts[1])
          });
        }
      }
    } else {
      // Positional parameters like @decorator(value1, value2)
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
      // Flask
      'app.route': 'Flask',
      'route': 'Flask',
      'before_request': 'Flask',
      'after_request': 'Flask',
      'teardown_request': 'Flask',
      'context_processor': 'Flask',
      'template_filter': 'Flask',
      'template_global': 'Flask',
      
      // Django
      'login_required': 'Django',
      'permission_required': 'Django',
      'user_passes_test': 'Django',
      'csrf_exempt': 'Django',
      'require_http_methods': 'Django',
      'require_GET': 'Django',
      'require_POST': 'Django',
      'require_safe': 'Django',
      'cache_page': 'Django',
      'never_cache': 'Django',
      'vary_on_headers': 'Django',
      'vary_on_cookie': 'Django',
      
      // FastAPI
      'app.get': 'FastAPI',
      'app.post': 'FastAPI',
      'app.put': 'FastAPI',
      'app.delete': 'FastAPI',
      'app.patch': 'FastAPI',
      'app.options': 'FastAPI',
      'app.head': 'FastAPI',
      'app.trace': 'FastAPI',
      'Depends': 'FastAPI',
      'HTTPException': 'FastAPI',
      
      // Pytest
      'pytest.fixture': 'Pytest',
      'pytest.mark.parametrize': 'Pytest',
      'pytest.mark.skip': 'Pytest',
      'pytest.mark.skipif': 'Pytest',
      'pytest.mark.xfail': 'Pytest',
      'pytest.mark.slow': 'Pytest',
      'fixture': 'Pytest',
      'mark.parametrize': 'Pytest',
      'mark.skip': 'Pytest',
      'mark.skipif': 'Pytest',
      'mark.xfail': 'Pytest',
      
      // Celery
      'task': 'Celery',
      'periodic_task': 'Celery',
      'shared_task': 'Celery',
      
      // SQLAlchemy
      'validates': 'SQLAlchemy',
      'reconstructor': 'SQLAlchemy',
      'hybrid_property': 'SQLAlchemy',
      'hybrid_method': 'SQLAlchemy',
      
      // Pydantic
      'validator': 'Pydantic',
      'root_validator': 'Pydantic',
      'field_validator': 'Pydantic',
      'model_validator': 'Pydantic',
      
      // Python built-ins
      'property': 'Python',
      'staticmethod': 'Python',
      'classmethod': 'Python',
      'cached_property': 'Python',
      'lru_cache': 'Python',
      'singledispatch': 'Python',
      'wraps': 'Python',
      'dataclass': 'Python',
      'total_ordering': 'Python',
      
      // Click
      'click.command': 'Click',
      'click.group': 'Click',
      'click.option': 'Click',
      'click.argument': 'Click',
      'command': 'Click',
      'group': 'Click',
      'option': 'Click',
      'argument': 'Click',
      
      // Typing
      'overload': 'Typing',
      'final': 'Typing',
      'runtime_checkable': 'Typing',
      
      // Deprecated
      'deprecated': 'Deprecated'
    };
    
    return frameworkMap[decoratorName];
  }

  categorizeAnnotation(decoratorName: string): string | undefined {
    const categoryMap: Record<string, string> = {
      // Web/API
      'app.route': 'web',
      'route': 'web',
      'app.get': 'web',
      'app.post': 'web',
      'app.put': 'web',
      'app.delete': 'web',
      'app.patch': 'web',
      'require_http_methods': 'web',
      'require_GET': 'web',
      'require_POST': 'web',
      
      // Authentication/Security
      'login_required': 'security',
      'permission_required': 'security',
      'user_passes_test': 'security',
      'csrf_exempt': 'security',
      
      // Caching
      'cache_page': 'caching',
      'never_cache': 'caching',
      'lru_cache': 'caching',
      'cached_property': 'caching',
      
      // Testing
      'pytest.fixture': 'testing',
      'fixture': 'testing',
      'pytest.mark.parametrize': 'testing',
      'mark.parametrize': 'testing',
      'pytest.mark.skip': 'testing',
      'mark.skip': 'testing',
      'pytest.mark.skipif': 'testing',
      'mark.skipif': 'testing',
      'pytest.mark.xfail': 'testing',
      'mark.xfail': 'testing',
      
      // Data/Persistence
      'validates': 'persistence',
      'validator': 'validation',
      'root_validator': 'validation',
      'field_validator': 'validation',
      'model_validator': 'validation',
      
      // Language Features
      'property': 'language',
      'staticmethod': 'language',
      'classmethod': 'language',
      'dataclass': 'language',
      'total_ordering': 'language',
      'overload': 'language',
      'final': 'language',
      'runtime_checkable': 'language',
      
      // Lifecycle/Events
      'before_request': 'lifecycle',
      'after_request': 'lifecycle',
      'teardown_request': 'lifecycle',
      'reconstructor': 'lifecycle',
      
      // Async/Tasks
      'task': 'async',
      'periodic_task': 'async',
      'shared_task': 'async',
      
      // CLI
      'click.command': 'cli',
      'command': 'cli',
      'click.group': 'cli',
      'group': 'cli',
      'click.option': 'cli',
      'option': 'cli',
      'click.argument': 'cli',
      'argument': 'cli',
      
      // Utilities
      'wraps': 'utility',
      'singledispatch': 'utility',
      'deprecated': 'utility',
      'vary_on_headers': 'utility',
      'vary_on_cookie': 'utility',
      
      // Templates
      'template_filter': 'template',
      'template_global': 'template',
      'context_processor': 'template'
    };
    
    return categoryMap[decoratorName];
  }

  protected isCommentLine(line: string): boolean {
    return line.trim().startsWith('#');
  }

  protected isAnnotationLine(line: string): boolean {
    return line.trim().startsWith('@');
  }
}