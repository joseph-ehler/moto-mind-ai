# 🛠️ tools/ Directory

**Purpose:** External development tools and standalone services that support the main application.

---

## 🎯 What Goes Here

**Use `tools/` for:**
- ✅ **Standalone services** that run separately from the main app
- ✅ **External development tools** not part of the build process
- ✅ **Supporting infrastructure** with independent deployment
- ✅ **Auxiliary servers** or services

**NOT for development scripts!**
- ❌ Build scripts → `scripts/`
- ❌ Test utilities → `tests/helpers/`
- ❌ Code generators → `templates/`

---

## 📁 Current Structure

```
tools/
└── mcp-server/          # Model Context Protocol server
    └── motomind/        # MotoMind MCP implementation
```

---

## 🤖 MCP Server

### **What is it?**
The Model Context Protocol (MCP) server provides context and tools to AI assistants (like Claude, GPT-4) for working with MotoMind AI's codebase.

### **Purpose:**
- Exposes codebase structure to AI assistants
- Provides custom tools for AI-assisted development
- Enables context-aware code generation
- Supports architecture understanding

### **Running the MCP Server:**
```bash
cd tools/mcp-server/motomind
npm install
npm start
```

### **Configuration:**
See `tools/mcp-server/motomind/README.md` for detailed setup.

---

## 🚦 When to Add New Tools

### **Create a New Tool When:**

```
✅ It's a standalone service (runs independently)
✅ It has its own dependencies
✅ It could be deployed separately
✅ It's not part of the main build
✅ It supports development but isn't required for the app
```

### **Examples of Good Tools:**

```
✅ MCP server for AI assistance
✅ Documentation generator
✅ Code analysis service
✅ Development proxy server
✅ Mock API server
```

### **NOT Tools (use different location):**

```
❌ Build scripts          → scripts/
❌ Database migrations    → database/migrations/
❌ Test helpers           → tests/helpers/
❌ Code generators        → templates/
❌ CLI commands           → scripts/
```

---

## 📋 Tool Structure Template

### **Recommended Layout:**

```
tools/[tool-name]/
├── README.md            # Tool documentation
├── package.json         # Dependencies (if Node.js)
├── tsconfig.json        # TypeScript config (if needed)
├── src/                 # Source code
│   ├── index.ts
│   └── ...
├── dist/                # Build output (gitignored)
└── .env.example         # Environment template
```

---

## 🔧 Adding a New Tool

### **1. Create Directory Structure**

```bash
mkdir -p tools/my-tool/{src,dist}
cd tools/my-tool
```

### **2. Initialize Package**

```bash
npm init -y
```

### **3. Add README**

```markdown
# My Tool

## Purpose
[What this tool does]

## Installation
npm install

## Usage
npm start

## Configuration
[Environment variables needed]
```

### **4. Add to Main README**

Update this file to document the new tool.

---

## 🚫 What NOT to Put Here

### **DON'T put in tools/:**

**Application Code:**
```
❌ tools/api/            (use app/api/)
❌ tools/components/     (use components/)
❌ tools/features/       (use features/)
```

**Build Scripts:**
```
❌ tools/build.sh        (use scripts/)
❌ tools/deploy.sh       (use scripts/)
```

**Development Scripts:**
```
❌ tools/test.sh         (use scripts/)
❌ tools/migrate.sh      (use scripts/migrations/)
```

**Generated Code:**
```
❌ tools/generated/      (use appropriate feature)
```

---

## 🎯 Tools vs Scripts vs Templates

### **Use tools/ for:**
- Standalone services
- Independent processes
- External infrastructure
- Long-running services

### **Use scripts/ for:**
- Build automation
- One-time tasks
- Development helpers
- Deployment scripts

### **Use templates/ for:**
- Code generators
- Scaffolding
- Boilerplate templates

---

## 📚 Related Documentation

- [Folder Structure Guide](../docs/architecture/FOLDER_STRUCTURE.md)
- [Scripts Directory](../scripts/README.md)
- [Templates Directory](../templates/README.md)

---

## 💡 Best Practices

1. **Self-contained** - Each tool should have its own dependencies
2. **Documented** - Always include a README
3. **Independent** - Should run without the main app
4. **Versioned** - Consider semantic versioning for tools
5. **Tested** - Tools should have their own tests

---

## ❓ Questions?

**"Should this be a tool or a script?"**
→ Standalone service? → tools/
→ One-time task? → scripts/

**"Should this be a tool or part of the app?"**
→ Runs separately? → tools/
→ Part of app? → appropriate app directory

**"Can tools depend on the main app?"**
→ Prefer loose coupling
→ Tools should be independent when possible
→ Use APIs or shared types if needed

---

**Maintained By:** Engineering Team  
**Questions?** See [CONTRIBUTING.md](../CONTRIBUTING.md)
