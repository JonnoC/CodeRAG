/**
 * Token limiting utilities for MCP responses
 * Estimates token count and applies limits to prevent excessive token usage
 */

export interface TokenLimitConfig {
  maxTokens: number;
  includeMetadata: boolean;
}

export interface TokenLimitResult<T> {
  data: T[];
  truncated: boolean;
  originalCount: number;
  returnedCount: number;
  estimatedTokens: number;
  metadata?: {
    message: string;
    suggestedActions?: string[];
  };
}

/**
 * Rough token estimation for JSON objects
 * Uses a conservative estimate of ~4 characters per token
 */
export function estimateTokens(obj: any): number {
  const jsonString = JSON.stringify(obj);
  return Math.ceil(jsonString.length / 4);
}

/**
 * Get MCP token limit from environment or use default
 */
export function getMcpTokenLimit(): number {
  const envLimit = process.env.MCP_TOKEN_LIMIT;
  if (envLimit) {
    const parsed = parseInt(envLimit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 10000; // Default 10K tokens
}

/**
 * Apply token limit to an array of objects
 * Returns as many objects as possible within the token limit
 */
export function applyTokenLimit<T>(
  data: T[],
  config?: Partial<TokenLimitConfig>
): TokenLimitResult<T> {
  const maxTokens = config?.maxTokens ?? getMcpTokenLimit();
  const includeMetadata = config?.includeMetadata ?? true;
  
  const result: TokenLimitResult<T> = {
    data: [],
    truncated: false,
    originalCount: data.length,
    returnedCount: 0,
    estimatedTokens: 0
  };

  // Reserve tokens for metadata if needed
  const metadataTokenReserve = includeMetadata ? 100 : 0;
  const availableTokens = maxTokens - metadataTokenReserve;

  let currentTokens = 0;
  let index = 0;

  // Add items until we hit the token limit
  while (index < data.length) {
    const itemTokens = estimateTokens(data[index]);
    
    if (currentTokens + itemTokens > availableTokens) {
      result.truncated = true;
      break;
    }

    result.data.push(data[index]);
    currentTokens += itemTokens;
    index++;
  }

  result.returnedCount = result.data.length;
  result.estimatedTokens = currentTokens;

  // Add helpful metadata if truncated
  if (result.truncated && includeMetadata) {
    const remaining = result.originalCount - result.returnedCount;
    result.metadata = {
      message: `Results truncated: showing ${result.returnedCount} of ${result.originalCount} items (${remaining} more available)`,
      suggestedActions: [
        "Use pagination with offset/limit parameters",
        "Apply more specific filters to reduce result set",
        "Use compact field selection to reduce token usage",
        `Increase MCP_TOKEN_LIMIT (currently ${maxTokens}) in environment`
      ]
    };
  }

  return result;
}

/**
 * Create a paginated response with token limiting
 */
export function createPaginatedResponse<T>(
  data: T[],
  offset: number = 0,
  limit?: number,
  tokenLimit?: number
): TokenLimitResult<T> & { hasMore: boolean; nextOffset?: number } {
  // Apply basic pagination first if limit is specified
  let paginatedData = data;
  if (limit !== undefined) {
    paginatedData = data.slice(offset, offset + limit);
  } else {
    paginatedData = data.slice(offset);
  }

  // Apply token limiting
  const result = applyTokenLimit(paginatedData, { 
    maxTokens: tokenLimit,
    includeMetadata: true 
  });

  // Calculate if there are more results
  const totalProcessed = offset + result.returnedCount;
  const hasMore = totalProcessed < data.length;
  const nextOffset = hasMore ? totalProcessed : undefined;

  return {
    ...result,
    hasMore,
    nextOffset,
    originalCount: data.length // Override to show total count, not just page count
  };
}