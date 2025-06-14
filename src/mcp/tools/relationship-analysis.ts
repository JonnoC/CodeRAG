import { EdgeManager } from '../../graph/edge-manager.js';

// Relationship Analysis Tool Parameters
export interface FindMethodCallersParams {
  methodName: string;
  projectId: string;
}

export interface FindImplementationsParams {
  interfaceName: string;
  projectId: string;
}

export interface FindInheritanceHierarchyParams {
  className: string;
  projectId: string;
}

// Relationship Analysis Functions
export async function findMethodCallers(
  edgeManager: EdgeManager,
  params: FindMethodCallersParams
) {
  const result = await edgeManager.findClassesThatCallMethod(params.methodName, params.projectId);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
}

export async function findImplementations(
  edgeManager: EdgeManager,
  params: FindImplementationsParams
) {
  const result = await edgeManager.findClassesThatImplementInterface(params.interfaceName, params.projectId);
  return {
    content: [{ 
      type: 'text', 
      text: result.length > 0 ? JSON.stringify(result, null, 2) : 'No classes found' 
    }]
  };
}

export async function findInheritanceHierarchy(
  edgeManager: EdgeManager,
  params: FindInheritanceHierarchyParams
) {
  const result = await edgeManager.findInheritanceHierarchy(params.className, params.projectId);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
}