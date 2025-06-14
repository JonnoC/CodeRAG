import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * React framework detection module
 * Handles React hooks and component decorators
 */
export class ReactFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'React';
  }

  protected initializeMappings(): void {
    // React Hooks (detected as function calls, but listed for completeness)
    this.frameworkMap.set('useState', 'React');
    this.frameworkMap.set('useEffect', 'React');
    this.frameworkMap.set('useContext', 'React');
    this.frameworkMap.set('useReducer', 'React');
    this.frameworkMap.set('useCallback', 'React');
    this.frameworkMap.set('useMemo', 'React');
    this.frameworkMap.set('useRef', 'React');
    this.frameworkMap.set('useImperativeHandle', 'React');
    this.frameworkMap.set('useLayoutEffect', 'React');
    this.frameworkMap.set('useDebugValue', 'React');

    // React Testing Library
    this.frameworkMap.set('render', 'React Testing');
    this.frameworkMap.set('screen', 'React Testing');

    // Categories
    this.categoryMap.set('useState', 'state');
    this.categoryMap.set('useEffect', 'lifecycle');
    this.categoryMap.set('useContext', 'state');
    this.categoryMap.set('useReducer', 'state');
    this.categoryMap.set('useCallback', 'performance');
    this.categoryMap.set('useMemo', 'performance');
    this.categoryMap.set('useRef', 'ui');
    this.categoryMap.set('useImperativeHandle', 'ui');
    this.categoryMap.set('useLayoutEffect', 'lifecycle');
    this.categoryMap.set('useDebugValue', 'utility');

    this.categoryMap.set('render', 'testing');
    this.categoryMap.set('screen', 'testing');
  }
}