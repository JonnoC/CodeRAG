import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Micronaut framework detection module
 * Handles modern, JVM-based, full-stack framework for microservices
 */
export class MicronautFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Micronaut';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Micronaut Core Annotations
    this.frameworkMap.set('MicronautApplication', 'Micronaut');
    this.frameworkMap.set('Singleton', 'Micronaut');
    this.frameworkMap.set('Prototype', 'Micronaut');
    this.frameworkMap.set('RequestScope', 'Micronaut');
    this.frameworkMap.set('Inject', 'Micronaut');
    this.frameworkMap.set('Named', 'Micronaut');
    this.frameworkMap.set('Qualifier', 'Micronaut');
    this.frameworkMap.set('Primary', 'Micronaut');
    this.frameworkMap.set('Secondary', 'Micronaut');
    this.frameworkMap.set('Factory', 'Micronaut');
    this.frameworkMap.set('Bean', 'Micronaut');
    this.frameworkMap.set('Context', 'Micronaut');

    // Micronaut HTTP
    this.frameworkMap.set('Controller', 'Micronaut');
    this.frameworkMap.set('Get', 'Micronaut');
    this.frameworkMap.set('Post', 'Micronaut');
    this.frameworkMap.set('Put', 'Micronaut');
    this.frameworkMap.set('Delete', 'Micronaut');
    this.frameworkMap.set('Patch', 'Micronaut');
    this.frameworkMap.set('Head', 'Micronaut');
    this.frameworkMap.set('Options', 'Micronaut');
    this.frameworkMap.set('Produces', 'Micronaut');
    this.frameworkMap.set('Consumes', 'Micronaut');
    this.frameworkMap.set('PathVariable', 'Micronaut');
    this.frameworkMap.set('QueryValue', 'Micronaut');
    this.frameworkMap.set('Header', 'Micronaut');
    this.frameworkMap.set('CookieValue', 'Micronaut');
    this.frameworkMap.set('Body', 'Micronaut');
    this.frameworkMap.set('Part', 'Micronaut');

    // Micronaut Configuration
    this.frameworkMap.set('ConfigurationProperties', 'Micronaut');
    this.frameworkMap.set('Property', 'Micronaut');
    this.frameworkMap.set('Value', 'Micronaut');
    this.frameworkMap.set('EachProperty', 'Micronaut');
    this.frameworkMap.set('EachBean', 'Micronaut');

    // Micronaut Validation
    this.frameworkMap.set('Valid', 'Micronaut');
    this.frameworkMap.set('NotNull', 'Micronaut');
    this.frameworkMap.set('NotEmpty', 'Micronaut');
    this.frameworkMap.set('NotBlank', 'Micronaut');
    this.frameworkMap.set('Size', 'Micronaut');
    this.frameworkMap.set('Min', 'Micronaut');
    this.frameworkMap.set('Max', 'Micronaut');
    this.frameworkMap.set('Email', 'Micronaut');
    this.frameworkMap.set('Pattern', 'Micronaut');

    // Micronaut Security
    this.frameworkMap.set('Secured', 'Micronaut Security');
    this.frameworkMap.set('RolesAllowed', 'Micronaut Security');
    this.frameworkMap.set('PreAuthorize', 'Micronaut Security');
    this.frameworkMap.set('PostAuthorize', 'Micronaut Security');

    // Micronaut AOP
    this.frameworkMap.set('Around', 'Micronaut');
    this.frameworkMap.set('AroundConstruct', 'Micronaut');
    this.frameworkMap.set('InterceptorBean', 'Micronaut');
    this.frameworkMap.set('Introduction', 'Micronaut');

    // Micronaut Events
    this.frameworkMap.set('EventListener', 'Micronaut');
    this.frameworkMap.set('Async', 'Micronaut');

    // Micronaut Scheduling
    this.frameworkMap.set('Scheduled', 'Micronaut');

    // Micronaut Data
    this.frameworkMap.set('Repository', 'Micronaut Data');
    this.frameworkMap.set('JdbcRepository', 'Micronaut Data');
    this.frameworkMap.set('Query', 'Micronaut Data');
    this.frameworkMap.set('Id', 'Micronaut Data');
    this.frameworkMap.set('GeneratedValue', 'Micronaut Data');
    this.frameworkMap.set('MappedEntity', 'Micronaut Data');
    this.frameworkMap.set('Transactional', 'Micronaut Data');

    // Micronaut Testing
    this.frameworkMap.set('MicronautTest', 'Micronaut Test');
    this.frameworkMap.set('MockBean', 'Micronaut Test');
    this.frameworkMap.set('TestPropertyProvider', 'Micronaut Test');

    // Micronaut Cache
    this.frameworkMap.set('Cacheable', 'Micronaut Cache');
    this.frameworkMap.set('CacheInvalidate', 'Micronaut Cache');
    this.frameworkMap.set('CachePut', 'Micronaut Cache');

    // Micronaut Retry
    this.frameworkMap.set('Retryable', 'Micronaut');
    this.frameworkMap.set('CircuitBreaker', 'Micronaut');

    // Micronaut Client
    this.frameworkMap.set('Client', 'Micronaut HTTP Client');

    // Categories
    this.categoryMap.set('MicronautApplication', 'language');
    
    this.categoryMap.set('Singleton', 'injection');
    this.categoryMap.set('Prototype', 'injection');
    this.categoryMap.set('RequestScope', 'injection');
    this.categoryMap.set('Inject', 'injection');
    this.categoryMap.set('Named', 'injection');
    this.categoryMap.set('Qualifier', 'injection');
    this.categoryMap.set('Primary', 'injection');
    this.categoryMap.set('Secondary', 'injection');
    this.categoryMap.set('Factory', 'injection');
    this.categoryMap.set('Bean', 'injection');
    this.categoryMap.set('Context', 'injection');

    this.categoryMap.set('Controller', 'web');
    this.categoryMap.set('Get', 'web');
    this.categoryMap.set('Post', 'web');
    this.categoryMap.set('Put', 'web');
    this.categoryMap.set('Delete', 'web');
    this.categoryMap.set('Patch', 'web');
    this.categoryMap.set('Head', 'web');
    this.categoryMap.set('Options', 'web');
    this.categoryMap.set('Produces', 'web');
    this.categoryMap.set('Consumes', 'web');
    this.categoryMap.set('PathVariable', 'web');
    this.categoryMap.set('QueryValue', 'web');
    this.categoryMap.set('Header', 'web');
    this.categoryMap.set('CookieValue', 'web');
    this.categoryMap.set('Body', 'web');
    this.categoryMap.set('Part', 'web');
    this.categoryMap.set('Client', 'web');

    this.categoryMap.set('ConfigurationProperties', 'configuration');
    this.categoryMap.set('Property', 'configuration');
    this.categoryMap.set('Value', 'configuration');
    this.categoryMap.set('EachProperty', 'configuration');
    this.categoryMap.set('EachBean', 'configuration');

    this.categoryMap.set('Valid', 'validation');
    this.categoryMap.set('NotNull', 'validation');
    this.categoryMap.set('NotEmpty', 'validation');
    this.categoryMap.set('NotBlank', 'validation');
    this.categoryMap.set('Size', 'validation');
    this.categoryMap.set('Min', 'validation');
    this.categoryMap.set('Max', 'validation');
    this.categoryMap.set('Email', 'validation');
    this.categoryMap.set('Pattern', 'validation');

    this.categoryMap.set('Secured', 'security');
    this.categoryMap.set('RolesAllowed', 'security');
    this.categoryMap.set('PreAuthorize', 'security');
    this.categoryMap.set('PostAuthorize', 'security');

    this.categoryMap.set('Around', 'aop');
    this.categoryMap.set('AroundConstruct', 'aop');
    this.categoryMap.set('InterceptorBean', 'aop');
    this.categoryMap.set('Introduction', 'aop');

    this.categoryMap.set('EventListener', 'events');
    this.categoryMap.set('Async', 'performance');
    this.categoryMap.set('Scheduled', 'performance');

    this.categoryMap.set('Repository', 'persistence');
    this.categoryMap.set('JdbcRepository', 'persistence');
    this.categoryMap.set('Query', 'persistence');
    this.categoryMap.set('Id', 'persistence');
    this.categoryMap.set('GeneratedValue', 'persistence');
    this.categoryMap.set('MappedEntity', 'persistence');
    this.categoryMap.set('Transactional', 'persistence');

    this.categoryMap.set('MicronautTest', 'testing');
    this.categoryMap.set('MockBean', 'testing');
    this.categoryMap.set('TestPropertyProvider', 'testing');

    this.categoryMap.set('Cacheable', 'performance');
    this.categoryMap.set('CacheInvalidate', 'performance');
    this.categoryMap.set('CachePut', 'performance');
    this.categoryMap.set('Retryable', 'performance');
    this.categoryMap.set('CircuitBreaker', 'performance');
  }

  private initializeImportPatterns(): void {
    // Micronaut Core - High confidence
    this.addImportPattern('io.micronaut.*', 95, 'Micronaut');
    this.addImportPattern('io.micronaut.context.*', 95, 'Micronaut');
    this.addImportPattern('io.micronaut.runtime.*', 95, 'Micronaut');
    this.addImportPattern('io.micronaut.core.*', 90, 'Micronaut');

    // Micronaut HTTP
    this.addImportPattern('io.micronaut.http.*', 95, 'Micronaut');
    this.addImportPattern('io.micronaut.http.annotation.*', 95, 'Micronaut');
    this.addImportPattern('io.micronaut.http.client.*', 90, 'Micronaut HTTP Client');

    // Micronaut Configuration
    this.addImportPattern('io.micronaut.context.annotation.*', 90, 'Micronaut');
    this.addImportPattern('io.micronaut.configuration.*', 85, 'Micronaut');

    // Micronaut Validation
    this.addImportPattern('io.micronaut.validation.*', 85, 'Micronaut');
    this.addImportPattern('jakarta.validation.*', 80, 'Micronaut');
    this.addImportPattern('javax.validation.*', 75, 'Micronaut');

    // Micronaut Security
    this.addImportPattern('io.micronaut.security.*', 90, 'Micronaut Security');

    // Micronaut AOP
    this.addImportPattern('io.micronaut.aop.*', 85, 'Micronaut');

    // Micronaut Data
    this.addImportPattern('io.micronaut.data.*', 95, 'Micronaut Data');

    // Micronaut Testing
    this.addImportPattern('io.micronaut.test.*', 95, 'Micronaut Test');

    // Micronaut Cache
    this.addImportPattern('io.micronaut.cache.*', 85, 'Micronaut Cache');

    // Micronaut Scheduling
    this.addImportPattern('io.micronaut.scheduling.*', 85, 'Micronaut');

    // Micronaut Inject
    this.addImportPattern('jakarta.inject.*', 75, 'Micronaut');
    this.addImportPattern('javax.inject.*', 70, 'Micronaut');
  }
}