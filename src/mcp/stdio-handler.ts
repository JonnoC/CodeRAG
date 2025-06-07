import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BaseHandler } from './base-handler.js';
import { Neo4jClient } from '../graph/neo4j-client.js';

export class StdioHandler extends BaseHandler {
  constructor(
    client: Neo4jClient,
    serverName: string = 'coderag-mcp-server',
    serverVersion: string = '1.0.0'
  ) {
    super(client, serverName, serverVersion, 'detailed');
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('CodeRAG MCP Server started via STDIO');
  }
}