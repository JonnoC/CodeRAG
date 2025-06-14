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
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Bean Validation Annotations
    this.frameworkMap.set('NotNull', 'Bean Validation');
    this.frameworkMap.set('NotEmpty', 'Bean Validation');
    this.frameworkMap.set('NotBlank', 'Bean Validation');
    this.frameworkMap.set('Size', 'Bean Validation');
    this.frameworkMap.set('Min', 'Bean Validation');
    this.frameworkMap.set('Max', 'Bean Validation');
    this.frameworkMap.set('Email', 'Bean Validation');
    this.frameworkMap.set('Pattern', 'Bean Validation');
    this.frameworkMap.set('Valid', 'Bean Validation');
    this.frameworkMap.set('AssertTrue', 'Bean Validation');
    this.frameworkMap.set('AssertFalse', 'Bean Validation');
    this.frameworkMap.set('DecimalMax', 'Bean Validation');
    this.frameworkMap.set('DecimalMin', 'Bean Validation');
    this.frameworkMap.set('Digits', 'Bean Validation');
    this.frameworkMap.set('Future', 'Bean Validation');
    this.frameworkMap.set('FutureOrPresent', 'Bean Validation');
    this.frameworkMap.set('Past', 'Bean Validation');
    this.frameworkMap.set('PastOrPresent', 'Bean Validation');
    this.frameworkMap.set('Negative', 'Bean Validation');
    this.frameworkMap.set('NegativeOrZero', 'Bean Validation');
    this.frameworkMap.set('Positive', 'Bean Validation');
    this.frameworkMap.set('PositiveOrZero', 'Bean Validation');

    // Categories - all are validation
    this.categoryMap.set('NotNull', 'validation');
    this.categoryMap.set('NotEmpty', 'validation');
    this.categoryMap.set('NotBlank', 'validation');
    this.categoryMap.set('Size', 'validation');
    this.categoryMap.set('Min', 'validation');
    this.categoryMap.set('Max', 'validation');
    this.categoryMap.set('Email', 'validation');
    this.categoryMap.set('Pattern', 'validation');
    this.categoryMap.set('Valid', 'validation');
    this.categoryMap.set('AssertTrue', 'validation');
    this.categoryMap.set('AssertFalse', 'validation');
    this.categoryMap.set('DecimalMax', 'validation');
    this.categoryMap.set('DecimalMin', 'validation');
    this.categoryMap.set('Digits', 'validation');
    this.categoryMap.set('Future', 'validation');
    this.categoryMap.set('FutureOrPresent', 'validation');
    this.categoryMap.set('Past', 'validation');
    this.categoryMap.set('PastOrPresent', 'validation');
    this.categoryMap.set('Negative', 'validation');
    this.categoryMap.set('NegativeOrZero', 'validation');
    this.categoryMap.set('Positive', 'validation');
    this.categoryMap.set('PositiveOrZero', 'validation');
  }

  private initializeImportPatterns(): void {
    // Bean Validation (Jakarta) - High confidence
    this.addImportPattern('jakarta.validation.*', 95, 'Bean Validation');
    this.addImportPattern('jakarta.validation.constraints.*', 95, 'Bean Validation');
    this.addImportPattern('jakarta.validation.groups.*', 85, 'Bean Validation');
    this.addImportPattern('jakarta.validation.metadata.*', 80, 'Bean Validation');

    // Bean Validation (Legacy javax) - High confidence
    this.addImportPattern('javax.validation.*', 90, 'Bean Validation');
    this.addImportPattern('javax.validation.constraints.*', 90, 'Bean Validation');
    this.addImportPattern('javax.validation.groups.*', 80, 'Bean Validation');
    this.addImportPattern('javax.validation.metadata.*', 75, 'Bean Validation');
  }
}