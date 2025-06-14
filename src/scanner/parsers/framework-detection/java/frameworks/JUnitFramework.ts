import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * JUnit testing framework detection module
 * Handles JUnit 5 lifecycle and test annotations
 */
export class JUnitFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'JUnit';
  }

  protected initializeMappings(): void {
    // JUnit Test Annotations
    this.frameworkMap.set('Test', 'JUnit');
    this.frameworkMap.set('BeforeEach', 'JUnit');
    this.frameworkMap.set('AfterEach', 'JUnit');
    this.frameworkMap.set('BeforeAll', 'JUnit');
    this.frameworkMap.set('AfterAll', 'JUnit');

    // Categories
    this.categoryMap.set('Test', 'testing');
    this.categoryMap.set('BeforeEach', 'lifecycle');
    this.categoryMap.set('AfterEach', 'lifecycle');
    this.categoryMap.set('BeforeAll', 'lifecycle');
    this.categoryMap.set('AfterAll', 'lifecycle');
  }
}