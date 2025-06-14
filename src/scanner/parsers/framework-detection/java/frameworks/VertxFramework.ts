import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Eclipse Vert.x framework detection module
 * Handles event-driven applications on the JVM
 */
export class VertxFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Eclipse Vert.x';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Vert.x Web Annotations
    this.frameworkMap.set('RouteHandler', 'Vert.x Web');
    this.frameworkMap.set('Route', 'Vert.x Web');

    // Vert.x Service Proxy Annotations
    this.frameworkMap.set('ProxyGen', 'Vert.x Service Proxy');
    this.frameworkMap.set('VertxGen', 'Vert.x Service Proxy');

    // Vert.x Reactive Annotations
    this.frameworkMap.set('Fluent', 'Vert.x');
    this.frameworkMap.set('GenIgnore', 'Vert.x');
    this.frameworkMap.set('CacheReturn', 'Vert.x');

    // Vert.x Unit Testing
    this.frameworkMap.set('Test', 'Vert.x Unit');
    this.frameworkMap.set('Before', 'Vert.x Unit');
    this.frameworkMap.set('After', 'Vert.x Unit');
    this.frameworkMap.set('BeforeClass', 'Vert.x Unit');
    this.frameworkMap.set('AfterClass', 'Vert.x Unit');
    this.frameworkMap.set('Timeout', 'Vert.x Unit');
    this.frameworkMap.set('Repeat', 'Vert.x Unit');

    // Vert.x Config Annotations
    this.frameworkMap.set('DataObject', 'Vert.x Config');

    // Vert.x Micrometer Metrics
    this.frameworkMap.set('Timed', 'Vert.x Metrics');
    this.frameworkMap.set('Counted', 'Vert.x Metrics');

    // Categories
    this.categoryMap.set('RouteHandler', 'web');
    this.categoryMap.set('Route', 'web');

    this.categoryMap.set('ProxyGen', 'service');
    this.categoryMap.set('VertxGen', 'service');

    this.categoryMap.set('Fluent', 'reactive');
    this.categoryMap.set('GenIgnore', 'reactive');
    this.categoryMap.set('CacheReturn', 'reactive');

    this.categoryMap.set('Test', 'testing');
    this.categoryMap.set('Before', 'testing');
    this.categoryMap.set('After', 'testing');
    this.categoryMap.set('BeforeClass', 'testing');
    this.categoryMap.set('AfterClass', 'testing');
    this.categoryMap.set('Timeout', 'testing');
    this.categoryMap.set('Repeat', 'testing');

    this.categoryMap.set('DataObject', 'configuration');

    this.categoryMap.set('Timed', 'monitoring');
    this.categoryMap.set('Counted', 'monitoring');
  }

  private initializeImportPatterns(): void {
    // Vert.x Core - High confidence
    this.addImportPattern('io.vertx.*', 95, 'Vert.x');
    this.addImportPattern('io.vertx.core.*', 95, 'Vert.x');
    this.addImportPattern('io.vertx.core.http.*', 90, 'Vert.x');
    this.addImportPattern('io.vertx.core.eventbus.*', 90, 'Vert.x');

    // Vert.x Web
    this.addImportPattern('io.vertx.ext.web.*', 95, 'Vert.x Web');
    this.addImportPattern('io.vertx.ext.web.handler.*', 90, 'Vert.x Web');

    // Vert.x Auth
    this.addImportPattern('io.vertx.ext.auth.*', 90, 'Vert.x Auth');

    // Vert.x JDBC Client
    this.addImportPattern('io.vertx.ext.jdbc.*', 85, 'Vert.x JDBC');
    this.addImportPattern('io.vertx.ext.sql.*', 85, 'Vert.x SQL');

    // Vert.x MongoDB Client
    this.addImportPattern('io.vertx.ext.mongo.*', 85, 'Vert.x MongoDB');

    // Vert.x Service Discovery
    this.addImportPattern('io.vertx.servicediscovery.*', 85, 'Vert.x Service Discovery');

    // Vert.x Circuit Breaker
    this.addImportPattern('io.vertx.circuitbreaker.*', 85, 'Vert.x Circuit Breaker');

    // Vert.x Config
    this.addImportPattern('io.vertx.config.*', 85, 'Vert.x Config');

    // Vert.x Health Check
    this.addImportPattern('io.vertx.ext.healthchecks.*', 85, 'Vert.x Health');

    // Vert.x Metrics
    this.addImportPattern('io.vertx.micrometer.*', 80, 'Vert.x Metrics');

    // Vert.x Unit Testing
    this.addImportPattern('io.vertx.ext.unit.*', 90, 'Vert.x Unit');

    // Vert.x RxJava
    this.addImportPattern('io.vertx.rxjava.*', 80, 'Vert.x RxJava');
    this.addImportPattern('io.vertx.rxjava2.*', 80, 'Vert.x RxJava');
    this.addImportPattern('io.vertx.rxjava3.*', 85, 'Vert.x RxJava');

    // Vert.x Reactive Streams
    this.addImportPattern('io.vertx.reactivex.*', 80, 'Vert.x Reactive');

    // Vert.x Kotlin
    this.addImportPattern('io.vertx.kotlin.*', 75, 'Vert.x Kotlin');
  }
}