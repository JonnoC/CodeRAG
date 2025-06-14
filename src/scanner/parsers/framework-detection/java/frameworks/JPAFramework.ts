import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * JPA (Java Persistence API) framework detection module
 * Handles JPA entity and relationship annotations
 */
export class JPAFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'JPA';
  }

  protected initializeMappings(): void {
    // JPA Annotations
    this.frameworkMap.set('Entity', 'JPA');
    this.frameworkMap.set('Table', 'JPA');
    this.frameworkMap.set('Id', 'JPA');
    this.frameworkMap.set('GeneratedValue', 'JPA');
    this.frameworkMap.set('Column', 'JPA');
    this.frameworkMap.set('JoinColumn', 'JPA');
    this.frameworkMap.set('OneToMany', 'JPA');
    this.frameworkMap.set('ManyToOne', 'JPA');
    this.frameworkMap.set('ManyToMany', 'JPA');
    this.frameworkMap.set('OneToOne', 'JPA');

    // Categories - all JPA annotations are persistence-related
    this.categoryMap.set('Entity', 'persistence');
    this.categoryMap.set('Table', 'persistence');
    this.categoryMap.set('Id', 'persistence');
    this.categoryMap.set('GeneratedValue', 'persistence');
    this.categoryMap.set('Column', 'persistence');
    this.categoryMap.set('JoinColumn', 'persistence');
    this.categoryMap.set('OneToMany', 'persistence');
    this.categoryMap.set('ManyToOne', 'persistence');
    this.categoryMap.set('ManyToMany', 'persistence');
    this.categoryMap.set('OneToOne', 'persistence');
  }
}