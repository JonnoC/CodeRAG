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
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // JUnit 5 Core Annotations
    this.frameworkMap.set('Test', 'JUnit');
    this.frameworkMap.set('BeforeEach', 'JUnit');
    this.frameworkMap.set('AfterEach', 'JUnit');
    this.frameworkMap.set('BeforeAll', 'JUnit');
    this.frameworkMap.set('AfterAll', 'JUnit');
    this.frameworkMap.set('DisplayName', 'JUnit');
    this.frameworkMap.set('DisplayNameGeneration', 'JUnit');
    this.frameworkMap.set('Nested', 'JUnit');
    this.frameworkMap.set('Tag', 'JUnit');
    this.frameworkMap.set('Tags', 'JUnit');

    // JUnit 5 Conditional Execution
    this.frameworkMap.set('Disabled', 'JUnit');
    this.frameworkMap.set('EnabledIf', 'JUnit');
    this.frameworkMap.set('DisabledIf', 'JUnit');
    this.frameworkMap.set('EnabledOnOs', 'JUnit');
    this.frameworkMap.set('DisabledOnOs', 'JUnit');
    this.frameworkMap.set('EnabledOnJre', 'JUnit');
    this.frameworkMap.set('DisabledOnJre', 'JUnit');
    this.frameworkMap.set('EnabledIfSystemProperty', 'JUnit');
    this.frameworkMap.set('DisabledIfSystemProperty', 'JUnit');
    this.frameworkMap.set('EnabledIfEnvironmentVariable', 'JUnit');
    this.frameworkMap.set('DisabledIfEnvironmentVariable', 'JUnit');

    // JUnit 5 Parameterized Tests
    this.frameworkMap.set('ParameterizedTest', 'JUnit');
    this.frameworkMap.set('ValueSource', 'JUnit');
    this.frameworkMap.set('EnumSource', 'JUnit');
    this.frameworkMap.set('MethodSource', 'JUnit');
    this.frameworkMap.set('CsvSource', 'JUnit');
    this.frameworkMap.set('CsvFileSource', 'JUnit');
    this.frameworkMap.set('ArgumentsSource', 'JUnit');

    // JUnit 5 Dynamic Tests
    this.frameworkMap.set('TestFactory', 'JUnit');

    // JUnit 5 Repeated Tests
    this.frameworkMap.set('RepeatedTest', 'JUnit');

    // JUnit 5 Timeouts
    this.frameworkMap.set('Timeout', 'JUnit');

    // JUnit 5 Order
    this.frameworkMap.set('TestMethodOrder', 'JUnit');
    this.frameworkMap.set('Order', 'JUnit');

    // JUnit 5 Extensions
    this.frameworkMap.set('ExtendWith', 'JUnit');
    this.frameworkMap.set('RegisterExtension', 'JUnit');

    // JUnit 4 Legacy Annotations (for detection)
    this.frameworkMap.set('Before', 'JUnit 4');
    this.frameworkMap.set('After', 'JUnit 4');
    this.frameworkMap.set('BeforeClass', 'JUnit 4');
    this.frameworkMap.set('AfterClass', 'JUnit 4');
    this.frameworkMap.set('Ignore', 'JUnit 4');
    this.frameworkMap.set('RunWith', 'JUnit 4');

    // Categories
    this.categoryMap.set('Test', 'testing');
    this.categoryMap.set('ParameterizedTest', 'testing');
    this.categoryMap.set('RepeatedTest', 'testing');
    this.categoryMap.set('TestFactory', 'testing');

    this.categoryMap.set('BeforeEach', 'lifecycle');
    this.categoryMap.set('AfterEach', 'lifecycle');
    this.categoryMap.set('BeforeAll', 'lifecycle');
    this.categoryMap.set('AfterAll', 'lifecycle');
    this.categoryMap.set('Before', 'lifecycle');
    this.categoryMap.set('After', 'lifecycle');
    this.categoryMap.set('BeforeClass', 'lifecycle');
    this.categoryMap.set('AfterClass', 'lifecycle');

    this.categoryMap.set('DisplayName', 'metadata');
    this.categoryMap.set('DisplayNameGeneration', 'metadata');
    this.categoryMap.set('Tag', 'metadata');
    this.categoryMap.set('Tags', 'metadata');
    this.categoryMap.set('Order', 'metadata');
    this.categoryMap.set('TestMethodOrder', 'metadata');

    this.categoryMap.set('Nested', 'organization');

    this.categoryMap.set('Disabled', 'conditional');
    this.categoryMap.set('EnabledIf', 'conditional');
    this.categoryMap.set('DisabledIf', 'conditional');
    this.categoryMap.set('EnabledOnOs', 'conditional');
    this.categoryMap.set('DisabledOnOs', 'conditional');
    this.categoryMap.set('EnabledOnJre', 'conditional');
    this.categoryMap.set('DisabledOnJre', 'conditional');
    this.categoryMap.set('EnabledIfSystemProperty', 'conditional');
    this.categoryMap.set('DisabledIfSystemProperty', 'conditional');
    this.categoryMap.set('EnabledIfEnvironmentVariable', 'conditional');
    this.categoryMap.set('DisabledIfEnvironmentVariable', 'conditional');
    this.categoryMap.set('Ignore', 'conditional');

    this.categoryMap.set('ValueSource', 'parameterized');
    this.categoryMap.set('EnumSource', 'parameterized');
    this.categoryMap.set('MethodSource', 'parameterized');
    this.categoryMap.set('CsvSource', 'parameterized');
    this.categoryMap.set('CsvFileSource', 'parameterized');
    this.categoryMap.set('ArgumentsSource', 'parameterized');

    this.categoryMap.set('Timeout', 'performance');

    this.categoryMap.set('ExtendWith', 'extension');
    this.categoryMap.set('RegisterExtension', 'extension');
    this.categoryMap.set('RunWith', 'extension');
  }

  private initializeImportPatterns(): void {
    // JUnit 5 - High confidence
    this.addImportPattern('org.junit.jupiter.*', 95, 'JUnit');
    this.addImportPattern('org.junit.jupiter.api.*', 95, 'JUnit');
    this.addImportPattern('org.junit.jupiter.params.*', 90, 'JUnit');
    this.addImportPattern('org.junit.jupiter.api.condition.*', 85, 'JUnit');
    this.addImportPattern('org.junit.jupiter.api.extension.*', 85, 'JUnit');

    // JUnit 4 Legacy - Medium confidence
    this.addImportPattern('org.junit.*', 80, 'JUnit 4');
    this.addImportPattern('org.junit.runner.*', 75, 'JUnit 4');
    this.addImportPattern('org.junit.runners.*', 75, 'JUnit 4');

    // JUnit Platform
    this.addImportPattern('org.junit.platform.*', 80, 'JUnit Platform');

    // JUnit Vintage (for running JUnit 4 tests in JUnit 5)
    this.addImportPattern('org.junit.vintage.*', 75, 'JUnit Vintage');

    // Assertions (could be from different libraries)
    this.addImportPattern('org.junit.jupiter.api.Assertions', 85, 'JUnit');
    this.addImportPattern('org.junit.Assert', 75, 'JUnit 4');
  }
}