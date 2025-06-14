import { NodeManager } from '../../graph/node-manager.js';
import { CodeNode } from '../../types.js';

// Node Management Tool Parameters
export interface AddNodeParams {
  id: string;
  project: string;
  type: CodeNode['type'];
  name: string;
  qualified_name: string;
  description?: string;
  source_file?: string;
  start_line?: number;
  end_line?: number;
  modifiers?: string[];
  attributes?: Record<string, any>;
}

export interface UpdateNodeParams {
  id: string;
  project: string;
  updates: Record<string, any>;
}

export interface GetNodeParams {
  nodeId: string;
  projectId: string;
}

export interface DeleteNodeParams {
  id: string;
  project: string;
}

export interface FindNodesByTypeParams {
  nodeType: CodeNode['type'];
  projectId: string;
}

export interface SearchNodesParams {
  searchTerm: string;
  projectId: string;
}

// Node Management Functions
export async function addNode(
  nodeManager: NodeManager,
  params: AddNodeParams
) {
  const node: CodeNode = {
    id: params.id,
    project_id: params.project,
    type: params.type,
    name: params.name,
    qualified_name: params.qualified_name,
    description: params.description,
    source_file: params.source_file,
    start_line: params.start_line,
    end_line: params.end_line,
    modifiers: params.modifiers,
    attributes: params.attributes
  };

  const result = await nodeManager.addNode(node);
  return {
    content: [{ type: 'text', text: `Node created successfully: ${JSON.stringify(result, null, 2)}` }]
  };
}

export async function updateNode(
  nodeManager: NodeManager,
  params: UpdateNodeParams
) {
  const result = await nodeManager.updateNode(params.id, params.project, params.updates);
  return {
    content: [{ type: 'text', text: `Node updated successfully: ${JSON.stringify(result, null, 2)}` }]
  };
}

export async function getNode(
  nodeManager: NodeManager,
  params: GetNodeParams
) {
  const result = await nodeManager.getNode(params.nodeId, params.projectId);
  return {
    content: [{ type: 'text', text: result ? JSON.stringify(result, null, 2) : 'Node not found' }]
  };
}

export async function deleteNode(
  nodeManager: NodeManager,
  params: DeleteNodeParams
) {
  const result = await nodeManager.deleteNode(params.id, params.project);
  return {
    content: [{ type: 'text', text: result ? 'Node deleted successfully' : 'Node not found' }]
  };
}

export async function findNodesByType(
  nodeManager: NodeManager,
  params: FindNodesByTypeParams
) {
  const result = await nodeManager.findNodesByType(params.nodeType, params.projectId);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
}

export async function searchNodes(
  nodeManager: NodeManager,
  params: SearchNodesParams
) {
  const result = await nodeManager.searchNodes(params.searchTerm, params.projectId);
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
}