import { BaseFrameworkDetector } from './FrameworkDetector.js';

export class TypeScriptFrameworkDetector extends BaseFrameworkDetector {
  protected frameworkMap: Record<string, string> = {
    // Angular
    'Component': 'Angular',
    'Injectable': 'Angular',
    'NgModule': 'Angular',
    'Directive': 'Angular',
    'Pipe': 'Angular',
    'Input': 'Angular',
    'Output': 'Angular',
    'ViewChild': 'Angular',
    'ViewChildren': 'Angular',
    'ContentChild': 'Angular',
    'ContentChildren': 'Angular',
    'HostBinding': 'Angular',
    'HostListener': 'Angular',
    
    // NestJS
    'Controller': 'NestJS',
    'Service': 'NestJS',
    'Module': 'NestJS',
    'Get': 'NestJS',
    'Post': 'NestJS',
    'Put': 'NestJS',
    'Delete': 'NestJS',
    'Patch': 'NestJS',
    'Body': 'NestJS',
    'Param': 'NestJS',
    'Query': 'NestJS',
    'Headers': 'NestJS',
    'Req': 'NestJS',
    'Res': 'NestJS',
    'Guard': 'NestJS',
    'UseGuards': 'NestJS',
    'UseFilters': 'NestJS',
    'UseInterceptors': 'NestJS',
    'UsePipes': 'NestJS',
    
    // TypeORM
    'Entity': 'TypeORM',
    'Column': 'TypeORM',
    'PrimaryGeneratedColumn': 'TypeORM',
    'PrimaryColumn': 'TypeORM',
    'OneToMany': 'TypeORM',
    'ManyToOne': 'TypeORM',
    'ManyToMany': 'TypeORM',
    'OneToOne': 'TypeORM',
    'JoinColumn': 'TypeORM',
    'JoinTable': 'TypeORM',
    'Repository': 'TypeORM',
    
    // React
    'memo': 'React',
    'forwardRef': 'React',
    'useState': 'React',
    'useEffect': 'React',
    'useContext': 'React',
    'useReducer': 'React',
    'useCallback': 'React',
    'useMemo': 'React',
    
    // MobX
    'observable': 'MobX',
    'action': 'MobX',
    'computed': 'MobX',
    'observer': 'MobX',
    
    // Inversify
    'injectable': 'Inversify',
    'inject': 'Inversify',
    'named': 'Inversify',
    'tagged': 'Inversify',
    'multiInject': 'Inversify',
    'optional': 'Inversify',
    
    // TypeScript
    'sealed': 'TypeScript',
    'enumerable': 'TypeScript',
    'override': 'TypeScript',
    'deprecated': 'TypeScript'
  };

  protected categoryMap: Record<string, string> = {
    // UI
    'Component': 'ui',
    'Directive': 'ui',
    'Pipe': 'ui',
    'memo': 'ui',
    'forwardRef': 'ui',
    
    // Injection
    'Injectable': 'injection',
    'Service': 'injection',
    'injectable': 'injection',
    'inject': 'injection',
    'named': 'injection',
    'tagged': 'injection',
    'multiInject': 'injection',
    'optional': 'injection',
    
    // Web
    'Controller': 'web',
    'Get': 'web',
    'Post': 'web',
    'Put': 'web',
    'Delete': 'web',
    'Patch': 'web',
    'Body': 'web',
    'Param': 'web',
    'Query': 'web',
    'Headers': 'web',
    'Req': 'web',
    'Res': 'web',
    
    // Persistence
    'Entity': 'persistence',
    'Column': 'persistence',
    'PrimaryGeneratedColumn': 'persistence',
    'PrimaryColumn': 'persistence',
    'OneToMany': 'persistence',
    'ManyToOne': 'persistence',
    'ManyToMany': 'persistence',
    'OneToOne': 'persistence',
    'JoinColumn': 'persistence',
    'JoinTable': 'persistence',
    'Repository': 'persistence',
    
    // Events
    'Input': 'events',
    'Output': 'events',
    'HostBinding': 'events',
    'HostListener': 'events',
    'ViewChild': 'events',
    'ViewChildren': 'events',
    'ContentChild': 'events',
    'ContentChildren': 'events',
    
    // State
    'observable': 'state',
    'action': 'state',
    'computed': 'state',
    'observer': 'state',
    'useState': 'state',
    'useReducer': 'state',
    'useContext': 'state',
    
    // Performance
    'useCallback': 'performance',
    'useMemo': 'performance',
    
    // Lifecycle
    'NgModule': 'lifecycle',
    'Module': 'lifecycle',
    'useEffect': 'lifecycle',
    
    // Security
    'Guard': 'security',
    'UseGuards': 'security',
    'UseFilters': 'security',
    'UseInterceptors': 'security',
    'UsePipes': 'security',
    
    // Language
    'sealed': 'language',
    'enumerable': 'language',
    'override': 'language',
    'deprecated': 'language'
  };
}