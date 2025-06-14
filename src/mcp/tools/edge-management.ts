import { EdgeManager } from '../../graph/edge-manager.js';
import { CodeEdge } from '../../types.js';

// Edge Management Tool Parameters
export interface AddEdgeParams {
  id: string;
  project: string;
  type: CodeEdge['type'];
  source: string;
  target: string;
  attributes?: Record<string, any>;
}

export interface GetEdgeParams {
  id: string;
  project: string;
}

export interface DeleteEdgeParams {
  id: string;
  project: string;
}

export interface FindEdgesBySourceParams {
  project: string;
  sourceId: string;
}

// Edge Management Functions
export async function addEdge(
  edgeManager: EdgeManager,
  params: AddEdgeParams
) {
  const edge: CodeEdge = {
    id: params.id,
    project_id: params.project,
    type: params.type,
    source: params.source,
    target: params.target,
    attributes: params.attributes
  };

  const result = await edgeManager.addEdge(edge);
  return {
    content: [{ type: 'text', text: `Edge created successfully: ${JSON.stringify(result, null, 2)}` }]
  };
}

export async function getEdge(
  edgeManager: EdgeManager,
  params: GetEdgeParams
) {
  const result = await edgeManager.getEdge(params.id, params.project);
  return {
    content: [{ type: 'text', text: result ? JSON.stringify(result, null, 2) : 'Edge not found' }]
  };
}

export async function deleteEdge(
  edgeManager: EdgeManager,
  params: DeleteEdgeParams
) {
  const result = await edgeManager.deleteEdge(params.id, params.project);
  return {
    content: [{ type: 'text', text: result ? 'Edge deleted successfully' : 'Edge not found' }]
  };
}

export async function findEdgesBySource(
  edgeManager: EdgeManager,
  params: FindEdgesBySourceParams
) {
  const result = await edgeManager.findEdgesBySource(params.sourceId, params.project);
  return {
    content: [{ 
      type: 'text', 
      text: result.length > 0 ? JSON.stringify(result, null, 2) : 'No edges found' 
    }]
  };
}