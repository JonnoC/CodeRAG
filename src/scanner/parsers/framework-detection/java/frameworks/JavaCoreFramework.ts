import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Java Core framework detection module
 * Handles built-in Java language annotations
 */
export class JavaCoreFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Java';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Java Core Annotations
    this.frameworkMap.set('Override', 'Java');
    this.frameworkMap.set('Deprecated', 'Java');
    this.frameworkMap.set('SuppressWarnings', 'Java');
    this.frameworkMap.set('FunctionalInterface', 'Java');
    this.frameworkMap.set('SafeVarargs', 'Java');

    // Categories - all are language features
    this.categoryMap.set('Override', 'language');
    this.categoryMap.set('Deprecated', 'language');
    this.categoryMap.set('SuppressWarnings', 'language');
    this.categoryMap.set('FunctionalInterface', 'language');
    this.categoryMap.set('SafeVarargs', 'language');
  }

  private initializeImportPatterns(): void {
    // Java core packages - High confidence
    this.addImportPattern('java.lang.*', 95, 'Java');
    this.addImportPattern('java.util.*', 90, 'Java');
    this.addImportPattern('java.io.*', 85, 'Java');
    this.addImportPattern('java.nio.*', 85, 'Java');
    this.addImportPattern('java.net.*', 80, 'Java');
    this.addImportPattern('java.time.*', 85, 'Java');
    this.addImportPattern('java.text.*', 80, 'Java');
    this.addImportPattern('java.math.*', 80, 'Java');
    this.addImportPattern('java.security.*', 75, 'Java');
    this.addImportPattern('java.beans.*', 75, 'Java');
    this.addImportPattern('java.sql.*', 80, 'Java');
    this.addImportPattern('java.concurrent.*', 80, 'Java');
    this.addImportPattern('java.util.concurrent.*', 85, 'Java');
    this.addImportPattern('java.util.stream.*', 85, 'Java');
    this.addImportPattern('java.util.function.*', 85, 'Java');
    this.addImportPattern('java.util.regex.*', 80, 'Java');
  }
}