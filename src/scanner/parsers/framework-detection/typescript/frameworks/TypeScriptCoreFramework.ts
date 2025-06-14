import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * TypeScript Core framework detection module
 * Handles built-in TypeScript decorators and language features
 */
export class TypeScriptCoreFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'TypeScript';
  }

  protected initializeMappings(): void {
    // TypeScript Experimental Decorators
    this.frameworkMap.set('sealed', 'TypeScript');
    this.frameworkMap.set('enumerable', 'TypeScript');
    this.frameworkMap.set('configurable', 'TypeScript');

    // Categories - all are language features
    this.categoryMap.set('sealed', 'language');
    this.categoryMap.set('enumerable', 'language');
    this.categoryMap.set('configurable', 'language');
  }
}