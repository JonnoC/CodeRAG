import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Lombok framework detection module
 * Handles Lombok code generation annotations
 */
export class LombokFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Lombok';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Lombok Core Annotations
    this.frameworkMap.set('Data', 'Lombok');
    this.frameworkMap.set('Builder', 'Lombok');
    this.frameworkMap.set('AllArgsConstructor', 'Lombok');
    this.frameworkMap.set('NoArgsConstructor', 'Lombok');
    this.frameworkMap.set('RequiredArgsConstructor', 'Lombok');
    this.frameworkMap.set('Getter', 'Lombok');
    this.frameworkMap.set('Setter', 'Lombok');
    this.frameworkMap.set('ToString', 'Lombok');
    this.frameworkMap.set('EqualsAndHashCode', 'Lombok');

    // Lombok Additional Annotations
    this.frameworkMap.set('Value', 'Lombok');
    this.frameworkMap.set('NonNull', 'Lombok');
    this.frameworkMap.set('Cleanup', 'Lombok');
    this.frameworkMap.set('SneakyThrows', 'Lombok');
    this.frameworkMap.set('Synchronized', 'Lombok');
    this.frameworkMap.set('Delegate', 'Lombok');
    this.frameworkMap.set('Lazy', 'Lombok');
    this.frameworkMap.set('Log', 'Lombok');
    this.frameworkMap.set('Slf4j', 'Lombok');
    this.frameworkMap.set('Log4j', 'Lombok');
    this.frameworkMap.set('Log4j2', 'Lombok');
    this.frameworkMap.set('CommonsLog', 'Lombok');
    this.frameworkMap.set('JBossLog', 'Lombok');
    this.frameworkMap.set('Flogger', 'Lombok');
    this.frameworkMap.set('CustomLog', 'Lombok');

    // Categories
    this.categoryMap.set('Data', 'codegen');
    this.categoryMap.set('Builder', 'codegen');
    this.categoryMap.set('AllArgsConstructor', 'codegen');
    this.categoryMap.set('NoArgsConstructor', 'codegen');
    this.categoryMap.set('RequiredArgsConstructor', 'codegen');
    this.categoryMap.set('Getter', 'codegen');
    this.categoryMap.set('Setter', 'codegen');
    this.categoryMap.set('ToString', 'codegen');
    this.categoryMap.set('EqualsAndHashCode', 'codegen');
    this.categoryMap.set('Value', 'codegen');

    this.categoryMap.set('NonNull', 'validation');
    this.categoryMap.set('Cleanup', 'cleanup');
    this.categoryMap.set('SneakyThrows', 'exception');
    this.categoryMap.set('Synchronized', 'concurrency');
    this.categoryMap.set('Delegate', 'codegen');
    this.categoryMap.set('Lazy', 'performance');

    this.categoryMap.set('Log', 'logging');
    this.categoryMap.set('Slf4j', 'logging');
    this.categoryMap.set('Log4j', 'logging');
    this.categoryMap.set('Log4j2', 'logging');
    this.categoryMap.set('CommonsLog', 'logging');
    this.categoryMap.set('JBossLog', 'logging');
    this.categoryMap.set('Flogger', 'logging');
    this.categoryMap.set('CustomLog', 'logging');
  }

  private initializeImportPatterns(): void {
    // Lombok Core - High confidence
    this.addImportPattern('lombok.*', 95, 'Lombok');
    this.addImportPattern('lombok.experimental.*', 85, 'Lombok');
    this.addImportPattern('lombok.extern.*', 90, 'Lombok');
    this.addImportPattern('lombok.extern.slf4j.*', 90, 'Lombok');
    this.addImportPattern('lombok.extern.log4j.*', 85, 'Lombok');
    this.addImportPattern('lombok.extern.java.*', 85, 'Lombok');
    this.addImportPattern('lombok.extern.apachecommons.*', 80, 'Lombok');
    this.addImportPattern('lombok.extern.jbosslog.*', 80, 'Lombok');
    this.addImportPattern('lombok.extern.flogger.*', 80, 'Lombok');
  }
}