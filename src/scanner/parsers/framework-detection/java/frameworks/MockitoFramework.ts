import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Mockito testing framework detection module
 * Handles Mockito mocking annotations
 */
export class MockitoFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Mockito';
  }

  protected initializeMappings(): void {
    // Mockito Annotations
    this.frameworkMap.set('Mock', 'Mockito');

    // Categories
    this.categoryMap.set('Mock', 'testing');
  }
}