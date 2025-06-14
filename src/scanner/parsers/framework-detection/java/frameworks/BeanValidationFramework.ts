import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Bean Validation framework detection module
 * Handles JSR-303/380 validation annotations
 */
export class BeanValidationFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Bean Validation';
  }

  protected initializeMappings(): void {
    // Bean Validation Annotations
    this.frameworkMap.set('NotNull', 'Bean Validation');
    this.frameworkMap.set('NotEmpty', 'Bean Validation');
    this.frameworkMap.set('NotBlank', 'Bean Validation');
    this.frameworkMap.set('Size', 'Bean Validation');
    this.frameworkMap.set('Min', 'Bean Validation');
    this.frameworkMap.set('Max', 'Bean Validation');
    this.frameworkMap.set('Email', 'Bean Validation');
    this.frameworkMap.set('Pattern', 'Bean Validation');

    // Categories - all are validation
    this.categoryMap.set('NotNull', 'validation');
    this.categoryMap.set('NotEmpty', 'validation');
    this.categoryMap.set('NotBlank', 'validation');
    this.categoryMap.set('Size', 'validation');
    this.categoryMap.set('Min', 'validation');
    this.categoryMap.set('Max', 'validation');
    this.categoryMap.set('Email', 'validation');
    this.categoryMap.set('Pattern', 'validation');
  }
}