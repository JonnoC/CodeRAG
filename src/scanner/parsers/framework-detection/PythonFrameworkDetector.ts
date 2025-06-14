import { BaseFrameworkDetector } from './FrameworkDetector.js';

export class PythonFrameworkDetector extends BaseFrameworkDetector {
  protected frameworkMap: Record<string, string> = {
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
    
    // Python Core
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

  protected categoryMap: Record<string, string> = {
    // Web
    'app.route': 'web',
    'route': 'web',
    'app.get': 'web',
    'app.post': 'web',
    'app.put': 'web',
    'app.delete': 'web',
    'app.patch': 'web',
    'app.options': 'web',
    'app.head': 'web',
    'app.trace': 'web',
    'require_http_methods': 'web',
    'require_GET': 'web',
    'require_POST': 'web',
    'require_safe': 'web',
    'HTTPException': 'web',
    
    // Security
    'login_required': 'security',
    'permission_required': 'security',
    'user_passes_test': 'security',
    'csrf_exempt': 'security',
    
    // Caching
    'cache_page': 'caching',
    'never_cache': 'caching',
    'vary_on_headers': 'caching',
    'vary_on_cookie': 'caching',
    'cached_property': 'caching',
    'lru_cache': 'caching',
    
    // Testing
    'pytest.fixture': 'testing',
    'pytest.mark.parametrize': 'testing',
    'pytest.mark.skip': 'testing',
    'pytest.mark.skipif': 'testing',
    'pytest.mark.xfail': 'testing',
    'pytest.mark.slow': 'testing',
    'fixture': 'testing',
    'mark.parametrize': 'testing',
    'mark.skip': 'testing',
    'mark.skipif': 'testing',
    'mark.xfail': 'testing',
    
    // Persistence
    'validates': 'persistence',
    'reconstructor': 'persistence',
    'hybrid_property': 'persistence',
    'hybrid_method': 'persistence',
    
    // Validation
    'validator': 'validation',
    'root_validator': 'validation',
    'field_validator': 'validation',
    'model_validator': 'validation',
    
    // Language
    'property': 'language',
    'staticmethod': 'language',
    'classmethod': 'language',
    'singledispatch': 'language',
    'wraps': 'language',
    'dataclass': 'language',
    'total_ordering': 'language',
    'overload': 'language',
    'final': 'language',
    'runtime_checkable': 'language',
    'deprecated': 'language',
    
    // Lifecycle
    'before_request': 'lifecycle',
    'after_request': 'lifecycle',
    'teardown_request': 'lifecycle',
    'context_processor': 'lifecycle',
    
    // Async
    'task': 'async',
    'periodic_task': 'async',
    'shared_task': 'async',
    
    // CLI
    'click.command': 'cli',
    'click.group': 'cli',
    'click.option': 'cli',
    'click.argument': 'cli',
    'command': 'cli',
    'group': 'cli',
    'option': 'cli',
    'argument': 'cli',
    
    // Utility
    'Depends': 'utility',
    
    // Template
    'template_filter': 'template',
    'template_global': 'template'
  };
}