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
}