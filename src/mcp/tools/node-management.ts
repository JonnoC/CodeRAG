import { NodeManager } from '../../graph/node-manager.js';
import { CodeNode } from '../../types.js';
import { applyTokenLimit, createPaginatedResponse } from '../../utils/token-limiter.js';

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
  limit?: number;
  offset?: number;
}

export interface SearchNodesParams {
  searchTerm: string;
  projectId: string;
  limit?: number;
  offset?: number;
}

// Node Management Functions
export async function addNode(
  nodeManager: NodeManager,
  params: AddNodeParams
) {
  try {
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
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to add node: ${error instanceof Error ? error.message : String(error)}` }]
    };
  }
}

export async function updateNode(
  nodeManager: NodeManager,
  params: UpdateNodeParams
) {
  try {
    const result = await nodeManager.updateNode(params.id, params.project, params.updates);
    return {
      content: [{ type: 'text', text: `Node updated successfully: ${JSON.stringify(result, null, 2)}` }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to update node: ${error instanceof Error ? error.message : String(error)}` }]
    };
  }
}

export async function getNode(
  nodeManager: NodeManager,
  params: GetNodeParams
) {
  try {
    const result = await nodeManager.getNode(params.nodeId, params.projectId);
    return {
      content: [{ type: 'text', text: result ? JSON.stringify(result, null, 2) : 'Node not found' }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get node: ${error instanceof Error ? error.message : String(error)}` }]
    };
  }
}

export async function deleteNode(
  nodeManager: NodeManager,
  params: DeleteNodeParams
) {
  try {
    const result = await nodeManager.deleteNode(params.id, params.project);
    return {
      content: [{ type: 'text', text: result ? 'Node deleted successfully' : 'Node not found' }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to delete node: ${error instanceof Error ? error.message : String(error)}` }]
    };
  }
}

export async function findNodesByType(
  nodeManager: NodeManager,
  params: FindNodesByTypeParams
) {
  try {
    const allResults = await nodeManager.findNodesByType(params.nodeType, params.projectId);
    
    // Apply token limiting with pagination
    const limitedResult = createPaginatedResponse(
      allResults,
      params.offset || 0,
      params.limit
    );

    const response: {
      results: CodeNode[];
      pagination: {
        total: number;
        returned: number;
        offset: number;
        hasMore: boolean;
        nextOffset: number | undefined;
      };
      truncated: boolean;
      estimatedTokens: number;
      metadata?: any;
    } = {
      results: limitedResult.data,
      pagination: {
        total: limitedResult.originalCount,
        returned: limitedResult.returnedCount,
        offset: params.offset || 0,
        hasMore: limitedResult.hasMore,
        nextOffset: limitedResult.nextOffset
      },
      truncated: limitedResult.truncated,
      estimatedTokens: limitedResult.estimatedTokens
    };

    // Add metadata if results were truncated
    if (limitedResult.metadata) {
      response.metadata = limitedResult.metadata;
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to find nodes: ${error instanceof Error ? error.message : String(error)}` }]
    };
  }
}

export async function searchNodes(
  nodeManager: NodeManager,
  params: SearchNodesParams
) {
  try {
    const allResults = await nodeManager.searchNodes(params.searchTerm, params.projectId);
    
    // Apply token limiting with pagination
    const limitedResult = createPaginatedResponse(
      allResults,
      params.offset || 0,
      params.limit
    );

    const response: {
      searchTerm: string;
      results: CodeNode[];
      pagination: {
        total: number;
        returned: number;
        offset: number;
        hasMore: boolean;
        nextOffset: number | undefined;
      };
      truncated: boolean;
      estimatedTokens: number;
      metadata?: any;
    } = {
      searchTerm: params.searchTerm,
      results: limitedResult.data,
      pagination: {
        total: limitedResult.originalCount,
        returned: limitedResult.returnedCount,
        offset: params.offset || 0,
        hasMore: limitedResult.hasMore,
        nextOffset: limitedResult.nextOffset
      },
      truncated: limitedResult.truncated,
      estimatedTokens: limitedResult.estimatedTokens
    };

    // Add metadata if results were truncated
    if (limitedResult.metadata) {
      response.metadata = limitedResult.metadata;
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to search nodes: ${error instanceof Error ? error.message : String(error)}` }]
    };
  }
}