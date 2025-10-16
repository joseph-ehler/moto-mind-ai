#!/bin/bash
#
# Cascade Tools - Quick Access Wrapper
# 
# Since MCP isn't working, this provides quick terminal commands
# that Cascade can run easily
#

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

case "$1" in
  "context")
    # Generate windsurf context
    cd "$PROJECT_ROOT"
    npm run windsurf:guide "${2:-build feature}"
    ;;
    
  "validate")
    # Validate patterns
    cd "$PROJECT_ROOT"
    npm run ai-platform:enforce -- --check-staged
    ;;
    
  "quality")
    # Check quality
    cd "$PROJECT_ROOT"
    npm run ai-platform:quality
    ;;
    
  "deps")
    # Check dependencies
    cd "$PROJECT_ROOT"
    npm run ai-platform:guardian -- --check
    ;;
    
  "graph")
    # Build codebase graph
    cd "$PROJECT_ROOT"
    npm run windsurf:graph
    ;;
    
  *)
    echo "🎯 Cascade Tools - Quick Access"
    echo ""
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  context <intent>  - Generate Windsurf context"
    echo "  validate          - Validate architectural patterns"
    echo "  quality           - Check code quality"
    echo "  deps              - Check dependencies"
    echo "  graph             - Build codebase graph"
    echo ""
    echo "Examples:"
    echo "  $0 context 'build notifications'"
    echo "  $0 validate"
    echo "  $0 quality"
    ;;
esac
