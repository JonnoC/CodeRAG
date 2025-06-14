import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Play Framework detection module
 * Handles reactive web framework for Java and Scala
 */
export class PlayFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Play Framework';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Play Framework Core Annotations
    this.frameworkMap.set('Controller', 'Play Framework');
    this.frameworkMap.set('With', 'Play Framework');
    this.frameworkMap.set('BodyParser', 'Play Framework');
    this.frameworkMap.set('Security', 'Play Framework');

    // Play Framework Dependency Injection
    this.frameworkMap.set('Inject', 'Play Framework');
    this.frameworkMap.set('Singleton', 'Play Framework');
    this.frameworkMap.set('Named', 'Play Framework');

    // Play Framework Caching
    this.frameworkMap.set('Cached', 'Play Framework');

    // Play Framework Database
    this.frameworkMap.set('Transactional', 'Play Framework');

    // Play Framework Validation (using Bean Validation)
    this.frameworkMap.set('Valid', 'Play Framework');
    this.frameworkMap.set('NotNull', 'Play Framework');
    this.frameworkMap.set('NotEmpty', 'Play Framework');
    this.frameworkMap.set('Size', 'Play Framework');
    this.frameworkMap.set('Min', 'Play Framework');
    this.frameworkMap.set('Max', 'Play Framework');
    this.frameworkMap.set('Pattern', 'Play Framework');
    this.frameworkMap.set('Email', 'Play Framework');

    // Play Framework Forms
    this.frameworkMap.set('Constraints', 'Play Framework');

    // Categories
    this.categoryMap.set('Controller', 'web');
    this.categoryMap.set('With', 'web');
    this.categoryMap.set('BodyParser', 'web');

    this.categoryMap.set('Security', 'security');

    this.categoryMap.set('Inject', 'injection');
    this.categoryMap.set('Singleton', 'injection');
    this.categoryMap.set('Named', 'injection');

    this.categoryMap.set('Cached', 'performance');

    this.categoryMap.set('Transactional', 'persistence');

    this.categoryMap.set('Valid', 'validation');
    this.categoryMap.set('NotNull', 'validation');
    this.categoryMap.set('NotEmpty', 'validation');
    this.categoryMap.set('Size', 'validation');
    this.categoryMap.set('Min', 'validation');
    this.categoryMap.set('Max', 'validation');
    this.categoryMap.set('Pattern', 'validation');
    this.categoryMap.set('Email', 'validation');
    this.categoryMap.set('Constraints', 'validation');
  }

  private initializeImportPatterns(): void {
    // Play Framework Core - High confidence
    this.addImportPattern('play.*', 95, 'Play Framework');
    this.addImportPattern('play.mvc.*', 95, 'Play Framework');
    this.addImportPattern('play.data.*', 90, 'Play Framework');
    this.addImportPattern('play.libs.*', 85, 'Play Framework');
    this.addImportPattern('play.cache.*', 85, 'Play Framework');
    this.addImportPattern('play.db.*', 85, 'Play Framework');

    // Play Framework Security
    this.addImportPattern('play.mvc.Security.*', 90, 'Play Framework');

    // Play Framework Validation
    this.addImportPattern('play.data.validation.*', 85, 'Play Framework');

    // Play Framework Configuration
    this.addImportPattern('play.Configuration', 85, 'Play Framework');
    this.addImportPattern('play.inject.*', 85, 'Play Framework');

    // Play Framework Testing
    this.addImportPattern('play.test.*', 90, 'Play Framework');

    // Play Framework JSON
    this.addImportPattern('play.libs.Json', 80, 'Play Framework');

    // Play Framework Akka (for reactive features)
    this.addImportPattern('akka.*', 70, 'Play Framework');

    // Dependency injection (Google Guice)
    this.addImportPattern('com.google.inject.*', 75, 'Play Framework');
    this.addImportPattern('javax.inject.*', 70, 'Play Framework');
    this.addImportPattern('jakarta.inject.*', 75, 'Play Framework');
  }
}