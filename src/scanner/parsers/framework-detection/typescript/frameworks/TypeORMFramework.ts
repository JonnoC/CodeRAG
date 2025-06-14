import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * TypeORM framework detection module
 * Handles TypeORM entity and relationship decorators
 */
export class TypeORMFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'TypeORM';
  }

  protected initializeMappings(): void {
    // TypeORM Entity Decorators
    this.frameworkMap.set('Entity', 'TypeORM');
    this.frameworkMap.set('Column', 'TypeORM');
    this.frameworkMap.set('PrimaryGeneratedColumn', 'TypeORM');
    this.frameworkMap.set('PrimaryColumn', 'TypeORM');
    this.frameworkMap.set('CreateDateColumn', 'TypeORM');
    this.frameworkMap.set('UpdateDateColumn', 'TypeORM');
    this.frameworkMap.set('DeleteDateColumn', 'TypeORM');
    this.frameworkMap.set('VersionColumn', 'TypeORM');

    // TypeORM Relationship Decorators
    this.frameworkMap.set('OneToMany', 'TypeORM');
    this.frameworkMap.set('ManyToOne', 'TypeORM');
    this.frameworkMap.set('ManyToMany', 'TypeORM');
    this.frameworkMap.set('OneToOne', 'TypeORM');
    this.frameworkMap.set('JoinColumn', 'TypeORM');
    this.frameworkMap.set('JoinTable', 'TypeORM');
    this.frameworkMap.set('RelationId', 'TypeORM');

    // TypeORM Index and Constraints
    this.frameworkMap.set('Index', 'TypeORM');
    this.frameworkMap.set('Unique', 'TypeORM');
    this.frameworkMap.set('Check', 'TypeORM');
    this.frameworkMap.set('Exclusion', 'TypeORM');

    // TypeORM Lifecycle Hooks
    this.frameworkMap.set('BeforeInsert', 'TypeORM');
    this.frameworkMap.set('AfterInsert', 'TypeORM');
    this.frameworkMap.set('BeforeUpdate', 'TypeORM');
    this.frameworkMap.set('AfterUpdate', 'TypeORM');
    this.frameworkMap.set('BeforeRemove', 'TypeORM');
    this.frameworkMap.set('AfterRemove', 'TypeORM');
    this.frameworkMap.set('BeforeRecover', 'TypeORM');
    this.frameworkMap.set('AfterRecover', 'TypeORM');
    this.frameworkMap.set('BeforeSoftRemove', 'TypeORM');
    this.frameworkMap.set('AfterSoftRemove', 'TypeORM');

    // Categories - all TypeORM decorators are persistence-related
    this.categoryMap.set('Entity', 'persistence');
    this.categoryMap.set('Column', 'persistence');
    this.categoryMap.set('PrimaryGeneratedColumn', 'persistence');
    this.categoryMap.set('PrimaryColumn', 'persistence');
    this.categoryMap.set('CreateDateColumn', 'persistence');
    this.categoryMap.set('UpdateDateColumn', 'persistence');
    this.categoryMap.set('DeleteDateColumn', 'persistence');
    this.categoryMap.set('VersionColumn', 'persistence');

    this.categoryMap.set('OneToMany', 'persistence');
    this.categoryMap.set('ManyToOne', 'persistence');
    this.categoryMap.set('ManyToMany', 'persistence');
    this.categoryMap.set('OneToOne', 'persistence');
    this.categoryMap.set('JoinColumn', 'persistence');
    this.categoryMap.set('JoinTable', 'persistence');
    this.categoryMap.set('RelationId', 'persistence');

    this.categoryMap.set('Index', 'persistence');
    this.categoryMap.set('Unique', 'persistence');
    this.categoryMap.set('Check', 'persistence');
    this.categoryMap.set('Exclusion', 'persistence');

    this.categoryMap.set('BeforeInsert', 'lifecycle');
    this.categoryMap.set('AfterInsert', 'lifecycle');
    this.categoryMap.set('BeforeUpdate', 'lifecycle');
    this.categoryMap.set('AfterUpdate', 'lifecycle');
    this.categoryMap.set('BeforeRemove', 'lifecycle');
    this.categoryMap.set('AfterRemove', 'lifecycle');
    this.categoryMap.set('BeforeRecover', 'lifecycle');
    this.categoryMap.set('AfterRecover', 'lifecycle');
    this.categoryMap.set('BeforeSoftRemove', 'lifecycle');
    this.categoryMap.set('AfterSoftRemove', 'lifecycle');
  }
}