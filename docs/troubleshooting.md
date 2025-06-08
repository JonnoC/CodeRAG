# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with CodeRAG.

## Common Issues

### 1. Neo4J Connection Failed

**Error:** `Failed to connect to Neo4J`

**Symptoms:**
- CodeRAG fails to start
- Tools return database connection errors
- "Connection refused" or "Connection timeout" messages

**Solutions:**

1. **Verify Neo4J is running:**
   ```bash
   # Check Neo4J Desktop status
   # OR check Docker container
   docker ps | grep neo4j
   
   # OR check system service
   systemctl status neo4j  # Linux
   brew services list | grep neo4j  # macOS
   ```

2. **Check connection details in `.env` file:**
   ```env
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_actual_password
   ```

3. **Verify firewall isn't blocking port 7687:**
   ```bash
   # Test connection
   telnet localhost 7687
   # OR
   nc -zv localhost 7687
   ```

4. **Test Neo4J browser access:**
   - Open `http://localhost:7474` in your browser
   - Login with your credentials
   - Run a simple query: `MATCH (n) RETURN count(n)`

5. **Check Neo4J logs for errors:**
   ```bash
   # Neo4J Desktop: Check logs in the database panel
   # Docker: docker logs neo4j-container-name
   # System install: Check /var/log/neo4j/
   ```

### 2. MCP Server Not Found

**Error:** AI tool can't find CodeRAG

**Symptoms:**
- AI assistant reports "MCP server not available"
- CodeRAG tools don't appear in tool list
- Connection timeout when starting MCP

**Solutions:**

1. **Verify MCP configuration file path and syntax:**
   ```bash
   # Check file exists
   ls -la ~/.claude/mcp_servers.json  # macOS/Linux
   dir %APPDATA%\Claude\mcp_servers.json  # Windows
   ```

2. **Validate JSON syntax:**
   ```bash
   # Test JSON validity
   cat ~/.claude/mcp_servers.json | jq .
   ```

3. **Check file permissions:**
   ```bash
   # Ensure file is readable
   chmod 644 ~/.claude/mcp_servers.json
   ```

4. **Ensure the built files exist:**
   ```bash
   # Build the project
   cd /path/to/CodeRAG
   npm run build
   
   # Verify build output
   ls -la build/index.js
   ```

5. **Check the path in MCP configuration is absolute:**
   ```json
   {
     "mcpServers": {
       "coderag": {
         "command": "node",
         "args": ["/absolute/path/to/CodeRAG/build/index.js"],
         "env": {
           "NEO4J_URI": "bolt://localhost:7687",
           "NEO4J_USER": "neo4j",
           "NEO4J_PASSWORD": "your_password"
         }
       }
     }
   }
   ```

6. **Test MCP server manually:**
   ```bash
   # Run MCP server directly
   cd /path/to/CodeRAG
   node build/index.js
   # Should start without errors
   ```

### 3. Parsing Errors

**Error:** Scanner fails to parse files

**Symptoms:**
- "Parse error" messages during scanning
- Files skipped during analysis
- Incomplete project representation

**Solutions:**

1. **Check file encoding (should be UTF-8):**
   ```bash
   # Check file encoding
   file -I path/to/file.java
   
   # Convert if needed
   iconv -f ISO-8859-1 -t UTF-8 file.java > file_utf8.java
   ```

2. **Verify file syntax is valid:**
   ```bash
   # For Java files
   javac -classpath . path/to/file.java
   
   # For TypeScript files
   tsc --noEmit path/to/file.ts
   
   # For Python files
   python -m py_compile path/to/file.py
   ```

3. **Check if language is supported:**
   - TypeScript (`.ts`, `.tsx`)
   - JavaScript (`.js`, `.jsx`)
   - Java (`.java`)
   - Python (`.py`)

4. **Review exclude patterns:**
   ```bash
   # Ensure you're not excluding files you want to scan
   npm run scan /path/to/project -- --exclude node_modules,dist
   ```

5. **Enable debug logging:**
   ```bash
   export LOG_LEVEL=debug
   npm run scan /path/to/project
   ```

### 4. Performance Issues

**Error:** Slow scanning or queries

**Symptoms:**
- Scanner takes very long time
- Queries timeout
- High memory usage

**Solutions:**

1. **Add database indexes (automatically created by scanner):**
   ```cypher
   // Verify indexes exist
   SHOW INDEXES
   
   // Create missing indexes if needed
   CREATE INDEX node_id_index FOR (n:Node) ON (n.id)
   CREATE INDEX project_id_index FOR (n) ON (n.project_id)
   ```

2. **Exclude unnecessary directories:**
   ```bash
   # Exclude large directories
   npm run scan /path/to/project -- --exclude node_modules,dist,build,vendor,.git
   ```

3. **Use `max_depth` parameter to limit scan depth:**
   ```bash
   # Limit directory traversal depth
   npm run scan /path/to/project -- --max-depth 6
   ```

4. **Consider scanning in smaller chunks:**
   ```bash
   # Scan modules separately
   npm run scan /path/to/project/src
   npm run scan /path/to/project/lib
   ```

5. **Increase Neo4J memory:**
   ```bash
   # Edit neo4j.conf
   dbms.memory.heap.initial_size=2G
   dbms.memory.heap.max_size=4G
   dbms.memory.pagecache.size=1G
   ```

## Debug Mode

Enable detailed logging to diagnose issues:

```bash
# Set environment variable
export LOG_LEVEL=debug

# Run with debug output
npm run dev

# Or for scanning
LOG_LEVEL=debug npm run scan /path/to/project
```

**Debug output includes:**
- Database connection details
- File parsing progress
- Query execution times
- Error stack traces
- Memory usage statistics

## Database Maintenance

### Clear all data
```cypher
MATCH (n) DETACH DELETE n
```

### View database schema
```cypher
CALL db.schema.visualization()
```

### Check node counts
```cypher
MATCH (n) RETURN labels(n), count(*)
```

### Find orphaned nodes
```cypher
// Nodes with no relationships
MATCH (n)
WHERE NOT (n)--() 
RETURN n
```

### Check database size
```cypher
// Database statistics
CALL dbms.queryJmx("org.neo4j:instance=kernel#0,name=Store file sizes")
```

## HTTP Mode Issues

### Server Won't Start

**Error:** HTTP server fails to start

**Solutions:**

1. **Check port availability:**
   ```bash
   # Check if port is in use
   lsof -i :3000
   netstat -tlnp | grep :3000
   ```

2. **Try different port:**
   ```bash
   npm start -- --sse --port 8080
   ```

3. **Check firewall settings:**
   ```bash
   # Allow port through firewall (Linux)
   sudo ufw allow 3000
   
   # Check macOS firewall settings
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
   ```

### API Endpoints Not Working

**Error:** HTTP requests fail or return errors

**Solutions:**

1. **Verify server is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check request format:**
   ```bash
   # Correct POST request format
   curl -X POST http://localhost:3000/api/parse/directory \
     -H "Content-Type: application/json" \
     -d '{"directory_path": "/path/to/project"}'
   ```

3. **Enable CORS if needed:**
   ```bash
   # For web applications, server includes CORS headers
   # Check browser console for CORS errors
   ```

## Multi-Project Issues

### Duplicate Project IDs

**Error:** Project ID conflicts

**Solutions:**

1. **Rename project directories:**
   ```bash
   # Use unique directory names
   mv project project-v1
   mv project-new project-v2
   ```

2. **Clear specific project before re-scanning:**
   ```bash
   npm run scan /path/to/project -- --clear-graph
   ```

### Can't Find Specific Project

**Error:** Tools can't locate project

**Solutions:**

1. **List available projects:**
   ```bash
   # Use list_projects tool to see all projects
   mcp call list_projects
   ```

2. **Check project ID spelling:**
   - Project IDs are case-sensitive
   - Derived from directory names
   - Special characters become hyphens

3. **Verify project was scanned successfully:**
   ```bash
   # Check scan logs for errors
   npm run scan /path/to/project
   ```

## Installation Issues

### npm install Fails

**Error:** Package installation errors

**Solutions:**

1. **Update Node.js version:**
   ```bash
   # Check version (need 18+)
   node --version
   
   # Update using nvm
   nvm install 18
   nvm use 18
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check network connectivity:**
   ```bash
   # Test npm registry access
   npm ping
   
   # Use different registry if needed
   npm install --registry https://registry.npmjs.org/
   ```

### Build Fails

**Error:** TypeScript compilation errors

**Solutions:**

1. **Update dependencies:**
   ```bash
   npm update
   npm run build
   ```

2. **Check TypeScript version:**
   ```bash
   npx tsc --version
   ```

3. **Clean build directory:**
   ```bash
   rm -rf build/
   npm run build
   ```

## Tool-Specific Issues

### Scanner Issues

**Problem:** Files not being scanned

**Check:**
1. File extensions are supported
2. Files aren't in excluded directories
3. Files have proper permissions
4. Syntax is valid

### Metrics Calculation Issues

**Problem:** Metrics return unexpected values

**Check:**
1. Class exists in database
2. Relationships are properly created
3. Project ID is correct
4. Database indexes are created

### Search Issues

**Problem:** Search returns no results

**Check:**
1. Case sensitivity in search terms
2. Node types are correct
3. Project filtering isn't too restrictive
4. Database actually contains data

## Getting Help

### Diagnostic Information

When seeking help, provide:

1. **CodeRAG version:**
   ```bash
   cat package.json | grep version
   ```

2. **Node.js version:**
   ```bash
   node --version
   npm --version
   ```

3. **Neo4J version:**
   ```cypher
   CALL dbms.components()
   ```

4. **Operating system:**
   ```bash
   uname -a  # Linux/macOS
   ver       # Windows
   ```

5. **Error logs:**
   ```bash
   # Enable debug logging and capture output
   LOG_LEVEL=debug npm start 2>&1 | tee coderag.log
   ```

### Self-Diagnosis Steps

1. **Check the logs** for detailed error messages
2. **Verify your setup** against the [Installation Guide](installation-setup.md)
3. **Test with a simple project** first
4. **Check Neo4J logs** for database issues
5. **Review AI tool logs** for MCP connection issues

### Testing Minimal Configuration

```bash
# Test minimal setup
cd /tmp
mkdir test-coderag
cd test-coderag

# Create simple Java file
echo 'public class Test { public void hello() {} }' > Test.java

# Test scanning
cd /path/to/CodeRAG
npm run scan /tmp/test-coderag
```

### Community Resources

- **Documentation**: Review all documentation files
- **Examples**: Check example configurations
- **GitHub Issues**: Search for similar problems
- **Neo4J Community**: For database-specific issues

## Prevention Tips

### Regular Maintenance

1. **Keep dependencies updated:**
   ```bash
   npm audit
   npm update
   ```

2. **Monitor disk space:**
   ```bash
   # Neo4J database can grow large
   du -sh ~/.neo4j/data
   ```

3. **Regular database cleanup:**
   ```cypher
   // Remove old or test data periodically
   MATCH (n:ProjectContext {project_id: 'test-project'})
   DETACH DELETE n
   ```

### Best Practices

1. **Use version control for MCP configurations**
2. **Test changes with small projects first**
3. **Keep backup of working configurations**
4. **Document custom setups and configurations**
5. **Monitor system resources during large scans**

## Next Steps

- [Installation & Setup](installation-setup.md) - Verify your installation
- [AI Integration](ai-integration.md) - Fix MCP connection issues
- [Scanner Usage](scanner-usage.md) - Resolve scanning problems
