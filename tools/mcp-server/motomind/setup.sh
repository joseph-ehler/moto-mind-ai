#!/bin/bash
#
# MotoMind MCP Server Setup
# 
# This script installs the MCP server and configures Windsurf
#

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🚀 MotoMind MCP Server Setup                         ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Get absolute path to project root (2 levels up from this script)
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MCP_SERVER_PATH="$PROJECT_ROOT/mcp-server/motomind"

echo "📂 Project root: $PROJECT_ROOT"
echo "📂 MCP server: $MCP_SERVER_PATH"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
cd "$MCP_SERVER_PATH"
npm install
echo "   ✅ Dependencies installed"
echo ""

# Step 2: Show configuration
echo "⚙️  Step 2: Windsurf Configuration"
echo ""
echo "Add this to your Windsurf settings:"
echo "(Command/Ctrl + , → Search for 'MCP')"
echo ""
echo "────────────────────────────────────────────────────────────"
cat << EOF
{
  "mcpServers": {
    "motomind": {
      "command": "node",
      "args": [
        "$MCP_SERVER_PATH/index.ts"
      ],
      "cwd": "$PROJECT_ROOT"
    }
  }
}
EOF
echo "────────────────────────────────────────────────────────────"
echo ""

# Step 3: Next steps
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Copy the configuration above"
echo "2. Open Windsurf settings (Command/Ctrl + ,)"
echo "3. Search for 'MCP'"
echo "4. Paste the configuration"
echo "5. Restart Windsurf"
echo "6. Ask Cascade: 'Can you see the motomind MCP tools?'"
echo ""
echo "🎉 Cascade will now have 8 new native tools!"
echo ""
