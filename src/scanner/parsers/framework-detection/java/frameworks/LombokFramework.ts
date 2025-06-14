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
    // Lombok Annotations
    this.frameworkMap.set('Data', 'Lombok');
    this.frameworkMap.set('Builder', 'Lombok');
    this.frameworkMap.set('AllArgsConstructor', 'Lombok');
    this.frameworkMap.set('NoArgsConstructor', 'Lombok');
    this.frameworkMap.set('RequiredArgsConstructor', 'Lombok');
    this.frameworkMap.set('Getter', 'Lombok');
    this.frameworkMap.set('Setter', 'Lombok');
    this.frameworkMap.set('ToString', 'Lombok');
    this.frameworkMap.set('EqualsAndHashCode', 'Lombok');

    // Categories - all are code generation
    this.categoryMap.set('Data', 'codegen');
    this.categoryMap.set('Builder', 'codegen');
    this.categoryMap.set('AllArgsConstructor', 'codegen');
    this.categoryMap.set('NoArgsConstructor', 'codegen');
    this.categoryMap.set('RequiredArgsConstructor', 'codegen');
    this.categoryMap.set('Getter', 'codegen');
    this.categoryMap.set('Setter', 'codegen');
    this.categoryMap.set('ToString', 'codegen');
    this.categoryMap.set('EqualsAndHashCode', 'codegen');
  }
}