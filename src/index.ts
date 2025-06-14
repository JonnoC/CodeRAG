#!/usr/bin/env node

import { getConfig } from './config.js';
import { Neo4jClient } from './graph/neo4j-client.js';
import { StdioHandler } from './mcp/stdio-handler.js';
import { HTTPHandler } from './mcp/http-handler.js';

async function main() {
  try {
    // Get configuration
    const config = getConfig();
    
    // Initialize Neo4J client
    const client = new Neo4jClient(config);
    await client.connect();
    await client.initializeDatabase();

    // Determine server mode from command line arguments
    const args = process.argv.slice(2);
    const mode = args.includes('--http') || args.includes('--sse') ? 'http' : 'stdio';
    const port = args.includes('--port') ? 
      parseInt(args[args.indexOf('--port') + 1]) || 3000 : 3000;

    if (mode === 'http') {
      // Start HTTP server with official MCP SDK
      const httpHandler = new HTTPHandler(client, port);
      await httpHandler.start();
    } else {
      // Start STDIO server (default)
      const stdioHandler = new StdioHandler(client);
      await stdioHandler.start();
    }

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('Shutting down...');
      await client.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('Shutting down...');
      await client.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}