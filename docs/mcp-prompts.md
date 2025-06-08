# MCP Prompts Guide

CodeRAG includes 4 guided prompts to help you effectively use the tools:

## 1. `analyze_codebase` - Comprehensive Analysis Guide

**Purpose:** Get step-by-step guidance for analyzing your codebase

**Usage:**
```
Use the analyze_codebase prompt for my TypeScript project
```

**What it provides:**
- Instructions for exploring existing graph data
- Steps to understand codebase structure
- Relationship analysis guidance
- Quality assessment workflow

**Best for:**
- First-time codebase exploration
- Comprehensive quality assessment
- Understanding unfamiliar codebases
- Preparing architecture documentation

**Example workflow:**
1. Prompt guides you to scan the project
2. Shows how to get overview with `get_project_summary`
3. Explains finding architectural issues
4. Demonstrates class-level analysis
5. Provides guidance on interpreting results

## 2. `setup_code_graph` - Project Setup Guide

**Purpose:** Step-by-step guide to set up a code graph for a new project

**Usage:**
```
Use the setup_code_graph prompt for language=java
```

**What it provides:**
- Scanning instructions
- Validation steps
- Structure analysis guidance
- Relationship exploration tips

**Best for:**
- New CodeRAG users
- Setting up analysis for new projects
- Ensuring proper configuration
- Learning the basic workflow

**Example workflow:**
1. Guides through initial project scanning
2. Shows how to verify scan results
3. Explains basic node and relationship queries
4. Demonstrates essential analysis tools
5. Provides troubleshooting tips

## 3. `find_dependencies` - Dependency Analysis

**Purpose:** Guide to find class dependencies and method calls

**Usage:**
```
Use the find_dependencies prompt for target_class=UserService
```

**What it provides:**
- Instructions to find what a class depends on
- Steps to find what depends on the class
- Coupling analysis guidance
- Visualization approaches

**Best for:**
- Analyzing specific classes or components
- Understanding coupling and dependencies
- Planning refactoring efforts
- Impact analysis for changes

**Example workflow:**
1. Shows how to find outgoing dependencies
2. Demonstrates finding incoming dependencies
3. Explains coupling metrics interpretation
4. Guides through relationship visualization
5. Provides refactoring recommendations

## 4. `analyze_inheritance` - Inheritance Analysis

**Purpose:** Guide to analyze inheritance hierarchies and interface implementations

**Usage:**
```
Use the analyze_inheritance prompt for class_or_interface=BaseRepository
```

**What it provides:**
- Hierarchy mapping instructions
- Implementation discovery steps
- Design pattern identification
- Architecture evaluation guidance

**Best for:**
- Object-oriented design analysis
- Understanding inheritance structures
- Identifying design patterns
- Evaluating abstraction levels

**Example workflow:**
1. Maps complete inheritance hierarchy
2. Finds all implementations of interfaces
3. Analyzes depth and breadth of inheritance
4. Identifies potential design issues
5. Suggests architectural improvements

## Using Prompts Effectively

### 1. Choose the Right Prompt

**Start with `setup_code_graph`** when:
- New to CodeRAG
- Working with a new project
- Need to verify setup

**Use `analyze_codebase`** when:
- Want comprehensive analysis
- Need to understand overall architecture
- Preparing quality reports

**Use `find_dependencies`** when:
- Investigating specific classes
- Planning refactoring
- Understanding coupling

**Use `analyze_inheritance`** when:
- Working with OOP codebases
- Analyzing design patterns
- Evaluating abstraction layers

### 2. Sequential Usage

**Recommended Order for New Projects:**
1. `setup_code_graph` - Initial setup and validation
2. `analyze_codebase` - Overall understanding
3. `find_dependencies` - Specific class investigation
4. `analyze_inheritance` - OOP structure analysis

### 3. Interactive Guidance

**Each prompt provides:**
- Clear step-by-step instructions
- Tool recommendations with exact parameters
- Interpretation guidance for results
- Follow-up suggestions
- Troubleshooting tips

**Example interaction:**
```
User: Use the analyze_codebase prompt for my TypeScript project

Assistant: I'll guide you through a comprehensive codebase analysis...

Step 1: First, let's scan your project
Use: scan_dir with your project path

Step 2: Get project overview
Use: get_project_summary

Step 3: Identify issues
Use: find_architectural_issues

[Continues with detailed guidance]
```

## Prompt Parameters

### Common Parameters

**Language-specific prompts:**
- `language`: Programming language (typescript, java, python, etc.)
- Affects tool recommendations and best practices

**Class-specific prompts:**
- `target_class`: Specific class to analyze
- `class_or_interface`: Class or interface name for inheritance analysis

**Project context:**
- `project_id`: Specific project in multi-project setup
- Automatically inferred if only one project exists

### Example Parameters

```
# Language-specific setup
analyze_codebase prompt for language=java

# Class-specific analysis
find_dependencies prompt for target_class=com.example.UserService

# Interface hierarchy analysis
analyze_inheritance prompt for class_or_interface=Repository

# Multi-project context
setup_code_graph prompt for language=typescript project_id=frontend-app
```

## Advanced Prompt Usage

### 1. Combining Prompts

**Sequential Analysis:**
```
1. setup_code_graph for language=java
2. analyze_codebase for comprehensive review
3. find_dependencies for UserService
4. analyze_inheritance for BaseEntity
```

**Focused Investigation:**
```
1. find_dependencies for problem class
2. analyze_inheritance for base classes
3. analyze_codebase for quality metrics
```

### 2. Multi-Project Workflows

**Portfolio Analysis:**
```
1. setup_code_graph for each project
2. analyze_codebase for each project  
3. Compare results across projects
```

**Migration Planning:**
```
1. analyze_codebase for legacy system
2. find_dependencies for core components
3. analyze_inheritance for key abstractions
```

### 3. Team Collaboration

**Code Review Preparation:**
```
1. analyze_codebase for overview
2. find_dependencies for changed classes
3. Share results with team
```

**Onboarding New Developers:**
```
1. setup_code_graph for project setup
2. analyze_codebase for architecture understanding
3. analyze_inheritance for design patterns
```

## Prompt Output and Follow-up

### Understanding Prompt Results

**Prompts provide:**
- Specific tool calls to make
- Expected output explanation
- Interpretation guidance
- Next step recommendations

**Example output structure:**
```
=== CodeRAG Guided Analysis ===

Step 1: Project Scanning
> Use tool: scan_dir
> Parameters: {"directory_path": "/path/to/project"}
> Expected: Project entities and relationships

Step 2: Overview Analysis  
> Use tool: get_project_summary
> Expected: Quality metrics and statistics
> Look for: High complexity classes, architectural issues

[Continues with detailed guidance]
```

### Follow-up Actions

**After using prompts:**
1. Execute recommended tool calls
2. Review and interpret results
3. Follow suggested next steps
4. Use additional prompts as needed
5. Document findings and decisions

## Troubleshooting Prompts

### Common Issues

**Prompt doesn't provide expected guidance:**
- Verify prompt name and parameters
- Check project context (single vs multi-project)
- Ensure project is properly scanned

**Tools mentioned in prompt not available:**
- Verify CodeRAG MCP server is connected
- Check tool permissions and configuration
- Restart AI assistant if needed

**Results don't match prompt expectations:**
- Verify project was scanned successfully
- Check for scanning errors or warnings
- Consider re-scanning with different options

### Getting Help

**When prompts aren't helpful:**
1. Check the [Available Tools](available-tools.md) guide
2. Review [Scanner Usage](scanner-usage.md) for setup issues
3. Consult [Troubleshooting](troubleshooting.md) for common problems
4. Try a different prompt that might be more appropriate

## Best Practices

### 1. Prompt Selection
- Start with setup prompts for new projects
- Use specific prompts for focused analysis
- Combine prompts for comprehensive understanding

### 2. Parameter Usage
- Provide specific class names when possible
- Include language context for better guidance
- Use project_id in multi-project environments

### 3. Result Interpretation
- Follow prompt guidance for interpreting results
- Look for patterns and trends, not just individual metrics
- Consider architectural context when evaluating findings

### 4. Documentation
- Document key findings from prompt-guided analysis
- Share insights with team members
- Use results to plan improvements and refactoring

## Next Steps

- [Available Tools](available-tools.md) - Detailed reference for all CodeRAG tools
- [Quality Metrics](quality-metrics.md) - Understanding analysis results
- [Troubleshooting](troubleshooting.md) - Solving common issues
