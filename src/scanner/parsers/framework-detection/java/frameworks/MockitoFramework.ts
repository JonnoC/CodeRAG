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
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Mockito Core Annotations
    this.frameworkMap.set('Mock', 'Mockito');
    this.frameworkMap.set('Spy', 'Mockito');
    this.frameworkMap.set('InjectMocks', 'Mockito');
    this.frameworkMap.set('Captor', 'Mockito');
    this.frameworkMap.set('MockBean', 'Mockito');
    this.frameworkMap.set('SpyBean', 'Mockito');

    // Mockito BDD Annotations
    this.frameworkMap.set('MockitoSettings', 'Mockito');
    this.frameworkMap.set('ExtendWith', 'Mockito');

    // Categories - all are testing
    this.categoryMap.set('Mock', 'testing');
    this.categoryMap.set('Spy', 'testing');
    this.categoryMap.set('InjectMocks', 'testing');
    this.categoryMap.set('Captor', 'testing');
    this.categoryMap.set('MockBean', 'testing');
    this.categoryMap.set('SpyBean', 'testing');
    this.categoryMap.set('MockitoSettings', 'testing');
    this.categoryMap.set('ExtendWith', 'testing');
  }

  private initializeImportPatterns(): void {
    // Mockito Core - High confidence
    this.addImportPattern('org.mockito.*', 95, 'Mockito');
    this.addImportPattern('org.mockito.junit.*', 90, 'Mockito');
    this.addImportPattern('org.mockito.runners.*', 85, 'Mockito');

    // Mockito BDD
    this.addImportPattern('org.mockito.BDDMockito', 85, 'Mockito');

    // Mockito ArgumentMatchers
    this.addImportPattern('org.mockito.ArgumentMatchers', 85, 'Mockito');

    // Mockito Verification
    this.addImportPattern('org.mockito.verification.*', 80, 'Mockito');

    // Mockito Answers
    this.addImportPattern('org.mockito.stubbing.*', 80, 'Mockito');

    // Mockito Inline (for final classes)
    this.addImportPattern('org.mockito.MockedStatic', 80, 'Mockito');
    this.addImportPattern('org.mockito.MockedConstruction', 80, 'Mockito');

    // Spring Boot Test Integration
    this.addImportPattern('org.springframework.boot.test.mock.mockito.*', 85, 'Mockito');
  }
}