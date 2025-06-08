# Code Quality Metrics Guide

CodeRAG provides comprehensive code quality analysis through multiple metric suites. These metrics help identify design issues, complexity problems, and architectural concerns in your codebase.

## Understanding Metric Classifications

CodeRAG uses a three-tier classification system for all metrics:

- **🟢 Good (Green)**: Optimal range indicating healthy code design
- **🟡 Warning (Yellow)**: Acceptable but should be monitored; consider improvement
- **🔴 Critical (Red)**: Problematic values requiring immediate attention

## CK Metrics Suite (Chidamber & Kemerer)

The CK metrics suite is a widely-accepted set of object-oriented design quality metrics introduced by Chidamber and Kemerer in 1994.

### WMC (Weighted Methods per Class)

**What it measures:** The complexity of a class based on the number and complexity of its methods.

**How it's calculated:**
- Counts all methods in a class (public, private, protected)
- Each method contributes 1 to the weight (simplified McCabe complexity)
- Formula: `WMC = Σ(complexity of each method)`

**Interpretation:**
- **🟢 Good: < 15** - Class has focused responsibilities and manageable complexity
- **🟡 Warning: 15-30** - Class is getting complex, consider refactoring
- **🔴 Critical: > 30** - Class likely violates Single Responsibility Principle

**Why it matters:**
- High WMC indicates classes that are difficult to understand, test, and maintain
- Classes with high WMC are more prone to bugs
- Affects testing effort (more methods = more test cases needed)

**Example:**
```java
// Good WMC (≈ 8)
class UserValidator {
    public boolean isValidEmail(String email) { ... }
    public boolean isValidPassword(String password) { ... }
    public boolean isValidAge(int age) { ... }
    private boolean checkDomain(String domain) { ... }
    // ... 4 more focused methods
}

// Critical WMC (≈ 35)
class UserManager {
    // 35+ methods handling user creation, validation, authentication,
    // email sending, logging, caching, etc.
}
```

### DIT (Depth of Inheritance Tree)

**What it measures:** The maximum depth of inheritance hierarchy from a class to the root class.

**How it's calculated:**
- Counts the number of ancestor classes up to the root
- Root classes (Object, base classes) have DIT = 0
- Each level of inheritance adds 1

**Interpretation:**
- **🟢 Good: < 3** - Shallow hierarchy, easy to understand and maintain
- **🟡 Warning: 3-4** - Moderate depth, acceptable for complex domains
- **🔴 Critical: > 4** - Deep hierarchy, difficult to understand and modify

**Why it matters:**
- Deep inheritance makes code harder to understand
- Changes to base classes affect many derived classes
- Increases complexity of method resolution
- Can indicate over-engineering

**Example:**
```java
// Good DIT = 2
Object -> Animal -> Dog

// Critical DIT = 6  
Object -> Vehicle -> MotorVehicle -> Car -> Sedan -> LuxurySedan -> BMWSedan
```

### NOC (Number of Children)

**What it measures:** The number of immediate subclasses that inherit from a class.

**How it's calculated:**
- Counts direct subclasses only (not grandchildren)
- Formula: `NOC = count(immediate subclasses)`

**Interpretation:**
- **🟢 Good: < 5** - Reasonable number of specializations
- **🟡 Warning: 5-7** - Many subclasses, ensure they're all necessary
- **🔴 Critical: > 7** - Too many subclasses, consider composition or interfaces

**Why it matters:**
- High NOC indicates a class may be too general or abstract
- Many subclasses increase testing complexity
- Changes to parent class affect many children
- May indicate improper abstraction level

**Example:**
```java
// Good NOC = 3
abstract class Shape {
    // Rectangle, Circle, Triangle inherit from Shape
}

// Critical NOC = 12
abstract class DatabaseConnection {
    // MySQL, PostgreSQL, Oracle, SQLServer, MongoDB, 
    // Redis, Cassandra, Neo4j, etc. all inherit directly
}
```

### CBO (Coupling Between Objects)

**What it measures:** The number of other classes that a class depends on or is coupled to.

**How it's calculated:**
- Counts classes referenced in field declarations, method parameters, return types
- Includes inheritance, composition, and association relationships
- Excludes primitive types and standard library classes (configurable)

**Interpretation:**
- **🟢 Good: < 5** - Low coupling, class is relatively independent
- **🟡 Warning: 5-10** - Moderate coupling, acceptable for complex functionality
- **🔴 Critical: > 10** - High coupling, class is tightly bound to many others

**Why it matters:**
- High coupling makes classes harder to test in isolation
- Changes ripple through highly coupled classes
- Reduces reusability and increases maintenance cost
- Indicates potential violation of dependency principles

**Example:**
```java
// Good CBO = 3
class EmailService {
    private EmailTemplate template;    // +1
    private EmailValidator validator;  // +1
    
    public void send(User user) { ... } // +1 for User
}

// Critical CBO = 15
class OrderProcessor {
    // Uses 15+ different classes: User, Product, PaymentGateway,
    // ShippingService, InventoryManager, EmailService, SMSService,
    // AuditLogger, SecurityManager, ConfigManager, etc.
}
```

### RFC (Response for Class)

**What it measures:** The total number of methods that can potentially be executed in response to a message received by an object of the class.

**How it's calculated:**
- Includes all methods in the class
- Plus all methods in other classes that are called by methods in this class
- Formula: `RFC = |{M}| + |{R}|` where M = methods in class, R = remote methods called

**Interpretation:**
- **🟢 Good: < 20** - Class has reasonable complexity and interactions
- **🟡 Warning: 20-30** - High complexity, consider refactoring
- **🔴 Critical: > 30** - Very high complexity, likely violates SRP

**Why it matters:**
- High RFC indicates complex classes that are hard to test
- Affects debugging difficulty (more potential execution paths)
- Correlates with defect density
- Indicates classes that may need decomposition

### LCOM (Lack of Cohesion in Methods)

**What it measures:** How well the methods in a class work together and share data.

**How it's calculated (LCOM4 variant):**
- Creates a graph where methods are nodes
- Edges connect methods that share instance variables
- Counts connected components in the graph
- Lower values indicate better cohesion

**Interpretation:**
- **🟢 Good: < 0.3** - High cohesion, methods work well together
- **🟡 Warning: 0.3-0.7** - Moderate cohesion, some methods may be unrelated
- **🔴 Critical: > 0.7** - Low cohesion, class likely has multiple responsibilities

**Why it matters:**
- Low cohesion suggests a class has multiple unrelated responsibilities
- High cohesion makes classes easier to understand and maintain
- Helps identify candidates for class decomposition
- Relates to Single Responsibility Principle

## Package Metrics

Package metrics analyze the structure and dependencies at the package/module level, helping identify architectural issues.

### Afferent Coupling (Ca)

**What it measures:** The number of classes outside a package that depend on classes inside the package.

**How it's calculated:**
- Counts external classes that import or use classes from this package
- Only counts direct dependencies

**Interpretation:**
- **High Ca**: Package is stable and widely used (good for libraries)
- **Low Ca**: Package may be unused or too specialized
- **Very High Ca**: Changes to this package will affect many other packages

**Use cases:**
- Identifying core/foundational packages
- Understanding impact of changes
- Planning refactoring priorities

### Efferent Coupling (Ce)

**What it measures:** The number of classes outside a package that classes inside the package depend on.

**How it's calculated:**
- Counts external classes that are imported or used by classes in this package
- Measures outgoing dependencies

**Interpretation:**
- **High Ce**: Package depends on many external packages (potentially unstable)
- **Low Ce**: Package is relatively self-contained
- **Very High Ce**: Package may violate dependency management principles

### Instability (I)

**What it measures:** The resilience to change of a package.

**How it's calculated:**
- Formula: `I = Ce / (Ca + Ce)`
- Ranges from 0 (maximally stable) to 1 (maximally unstable)

**Interpretation:**
- **🟢 I = 0**: Completely stable (only has incoming dependencies)
- **🟡 I = 0.5**: Balanced stability
- **🔴 I = 1**: Completely unstable (only has outgoing dependencies)

**Why it matters:**
- Unstable packages should not be depended upon by stable packages
- Helps identify architectural violations
- Guides dependency management decisions

### Abstractness (A)

**What it measures:** The ratio of abstract classes and interfaces to total classes in a package.

**How it's calculated:**
- Formula: `A = (Abstract Classes + Interfaces) / Total Classes`
- Ranges from 0 (completely concrete) to 1 (completely abstract)

**Interpretation:**
- **A = 0**: Package contains only concrete classes
- **A = 1**: Package contains only abstract classes/interfaces
- **Optimal A**: Depends on package role (utilities ≈ 0, frameworks ≈ 1)

### Distance from Main Sequence (D)

**What it measures:** How well a package balances abstractness and stability.

**How it's calculated:**
- Formula: `D = |A + I - 1|`
- Measures distance from the "main sequence" line where A + I = 1

**Interpretation:**
- **🟢 D ≈ 0**: Package is well-balanced
- **🔴 D ≈ 1**: Package is in "Zone of Pain" (concrete and stable) or "Zone of Uselessness" (abstract and unstable)

**The Main Sequence:**
- **Zone of Pain (I=0, A=0)**: Rigid, hard to change concrete classes
- **Zone of Uselessness (I=1, A=1)**: Abstract classes that nobody uses
- **Main Sequence**: Balanced packages that are either stable+abstract or unstable+concrete

## Architectural Issues Detection

CodeRAG automatically detects common architectural problems:

### Circular Dependencies

**What it detects:** Packages that have mutual dependencies, creating cycles in the dependency graph.

**Why it's problematic:**
- Makes individual testing difficult
- Complicates build processes
- Reduces modularity
- Can cause runtime issues (initialization order problems)

**Example:**
```
Package A depends on Package B
Package B depends on Package C  
Package C depends on Package A  // Creates cycle A → B → C → A
```

### God Classes

**What it detects:** Classes with excessive responsibilities, typically identified by:
- Very high WMC (> 50)
- High number of fields (> 20)
- Large number of methods (> 30)
- High CBO (> 15)

**Why it's problematic:**
- Violates Single Responsibility Principle
- Difficult to understand and maintain
- Hard to test comprehensively
- Becomes a bottleneck for changes

### High Coupling Classes

**What it detects:** Classes with CBO > 15, indicating excessive dependencies.

**Why it's problematic:**
- Changes require updates to many related classes
- Difficult to test in isolation
- Reduces reusability
- Increases maintenance complexity

### Unstable Dependencies

**What it detects:** Stable packages (low I) that depend on unstable packages (high I).

**Why it's problematic:**
- Violates Stable Dependencies Principle
- Stable code becomes affected by unstable code changes
- Can lead to unexpected breaking changes
- Makes the system harder to evolve

## Using Metrics Effectively

### 1. Metric Interpretation Guidelines

**Don't focus on single metrics:**
- Use metrics in combination for better insights
- Consider the context of your application domain
- Some complexity may be inherent to the problem being solved

**Trend analysis is more valuable than absolute values:**
- Track metrics over time to see improvement/degradation
- Focus on classes that are getting worse
- Celebrate improvements in metric trends

### 2. Prioritizing Improvements

**High-impact targets:**
1. **God Classes** with high WMC + high CBO
2. **Circular Dependencies** affecting core packages
3. **Highly Coupled Classes** in frequently changed areas
4. **Deep Inheritance** in business logic classes

**Lower priority:**
1. Slightly elevated metrics in stable, working code
2. Test classes with higher complexity (often acceptable)
3. Generated code or framework classes

### 3. Refactoring Strategies

**For High WMC:**
- Extract Method pattern
- Decompose into multiple classes
- Use Strategy or Command patterns

**For High CBO:**
- Introduce interfaces to reduce concrete dependencies
- Use Dependency Injection
- Apply Facade pattern for complex subsystems

**For Low Cohesion:**
- Split class based on method groupings
- Extract classes for each responsibility
- Use composition instead of inheritance

**For Deep Inheritance:**
- Favor composition over inheritance
- Use interfaces for contracts
- Flatten hierarchies where possible

## Getting Metric Reports

Use these CodeRAG tools to analyze your code quality:

```bash
# Get overall project quality summary
mcp call get_project_summary

# Calculate CK metrics for specific class
mcp call calculate_ck_metrics --arguments '{"class_id": "com.example.UserService"}'

# Analyze package metrics
mcp call calculate_package_metrics --arguments '{"package_name": "com.example.service"}'

# Find architectural issues
mcp call find_architectural_issues

# Compare metrics across projects
mcp call list_projects --arguments '{"include_stats": true, "sort_by": "entity_count"}'
```

## Metric Thresholds Reference

### CK Metrics Thresholds

| Metric | Good (🟢) | Warning (🟡) | Critical (🔴) |
|--------|-----------|--------------|---------------|
| WMC | < 15 | 15-30 | > 30 |
| DIT | < 3 | 3-4 | > 4 |
| NOC | < 5 | 5-7 | > 7 |
| CBO | < 5 | 5-10 | > 10 |
| RFC | < 20 | 20-30 | > 30 |
| LCOM | < 0.3 | 0.3-0.7 | > 0.7 |

### Package Metrics Guidelines

| Metric | Optimal Range | Notes |
|--------|--------------|-------|
| Ca | Context-dependent | High for libraries, low for applications |
| Ce | As low as possible | Indicates external dependencies |
| I | 0.0-1.0 | Stable packages near 0, unstable near 1 |
| A | 0.0-1.0 | Depends on package purpose |
| D | Close to 0 | Distance from main sequence |

### Architectural Issue Severities

| Issue Type | Critical Threshold | Notes |
|------------|-------------------|-------|
| God Classes | WMC > 50 | Combined with high CBO |
| High Coupling | CBO > 15 | Consider context |
| Deep Inheritance | DIT > 4 | Especially in business logic |
| Circular Dependencies | Any cycle | Always problematic |

## Best Practices

### 1. Regular Monitoring
- Include metrics in CI/CD pipelines
- Set up quality gates based on thresholds
- Track trends over time
- Review metrics during code reviews

### 2. Contextual Analysis
- Consider domain complexity
- Account for framework requirements
- Distinguish between business logic and infrastructure code
- Evaluate metrics relative to project phase (early development vs maintenance)

### 3. Gradual Improvement
- Focus on worst offenders first
- Set realistic improvement targets
- Refactor incrementally
- Measure impact of changes

### 4. Team Education
- Share metric meanings with the team
- Discuss architectural principles
- Use metrics to guide design decisions
- Celebrate quality improvements

## Next Steps

- [Available Tools](available-tools.md) - Tools for calculating and analyzing metrics
- [MCP Prompts Guide](mcp-prompts.md) - Guided workflows for quality analysis
- [Troubleshooting](troubleshooting.md) - Solving common metric calculation issues
