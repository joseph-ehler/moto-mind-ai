#!/bin/bash
# Codex Helper Scripts
# 
# Enables Codex CLI to read Windsurf context and report back

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get context file path
CONTEXT_FILE=".ai-context.json"

# ============================================================================
# HELPER: Read context
# ============================================================================
get_context() {
  if [ -f "$CONTEXT_FILE" ]; then
    cat "$CONTEXT_FILE"
  else
    echo "{}"
  fi
}

# ============================================================================
# HELPER: Get specific field from context
# ============================================================================
get_context_field() {
  local field=$1
  get_context | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf-8')).$field || ''"
}

# ============================================================================
# CODEX-AWARE: Run codex with context
# ============================================================================
codex-aware() {
  local task=$(get_context_field "currentTask")
  local phase=$(get_context_field "phase")
  local feature=$(get_context_field "feature")
  
  echo -e "${BLUE}🤖 Codex reading context...${NC}"
  echo -e "${BLUE}   Task: $task${NC}"
  [ -n "$phase" ] && echo -e "${BLUE}   Phase: $phase${NC}"
  [ -n "$feature" ] && echo -e "${BLUE}   Feature: $feature${NC}"
  echo ""
  
  # Add context to prompt
  local context_prompt="Context: Working on '$task'"
  [ -n "$phase" ] && context_prompt="$context_prompt, Phase: $phase"
  [ -n "$feature" ] && context_prompt="$context_prompt, Feature: $feature"
  
  # Run codex with context
  echo "$context_prompt. Question: $*" | codex
}

# ============================================================================
# CODEX-REPORT: Run codex and report back to Windsurf
# ============================================================================
codex-report() {
  local command="$*"
  echo -e "${BLUE}🤖 Codex executing with feedback...${NC}"
  
  # Run codex and capture output
  local output=$(codex "$@" 2>&1)
  local exit_code=$?
  
  # Show output
  echo "$output"
  
  # Report back to Windsurf via TypeScript
  npx tsx -e "
    const { getContextBridge } = require('./lib/ai/context-bridge.ts');
    
    (async () => {
      const bridge = getContextBridge();
      await bridge.updateFromCodex({
        command: '$command',
        result: \`$output\`,
        success: $exit_code === 0
      });
    })();
  " 2>/dev/null
  
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ Reported success to Windsurf${NC}"
  else
    echo -e "${RED}❌ Reported failure to Windsurf${NC}"
  fi
  
  return $exit_code
}

# ============================================================================
# CODEX-VALIDATE: Validate migration step
# ============================================================================
codex-validate() {
  local step=${1:-"current step"}
  
  echo -e "${YELLOW}🔍 Codex validating: $step${NC}"
  
  local feature=$(get_context_field "feature")
  local phase=$(get_context_field "phase")
  
  case "$phase" in
    "tests")
      echo -e "${BLUE}Running tests...${NC}"
      npm test "features/$feature" 2>&1 | codex-report "Validate test results for $feature"
      ;;
    "components")
      echo -e "${BLUE}Validating build...${NC}"
      npm run build 2>&1 | codex-report "Check build for component migration issues"
      ;;
    "domain")
      echo -e "${BLUE}Running full tests...${NC}"
      npm test 2>&1 | codex-report "Validate all tests after domain migration"
      ;;
    "validation")
      echo -e "${BLUE}Running full validation...${NC}"
      (npm test && npm run build && npm run arch:validate) 2>&1 | \
        codex-report "Final validation check for $feature migration"
      ;;
    *)
      echo -e "${YELLOW}No specific phase, running general validation${NC}"
      npm run build 2>&1 | codex-report "General validation"
      ;;
  esac
}

# ============================================================================
# CODEX-WATCH: Watch for Windsurf requests
# ============================================================================
codex-watch() {
  echo -e "${GREEN}👁️  Codex watcher started${NC}"
  echo -e "${GREEN}   Monitoring for Windsurf requests...${NC}"
  echo ""
  
  while true; do
    # Check if there's a pending action
    if npx tsx -e "require('./lib/ai/context-bridge.ts').checkPendingAction()" 2>/dev/null; then
      local action=$(get_context_field "nextAction")
      local feature=$(get_context_field "feature")
      
      echo -e "${YELLOW}🔔 Windsurf requested: $action${NC}"
      
      case "$action" in
        "validate")
          codex-validate "Windsurf request"
          ;;
        "test")
          echo -e "${BLUE}Running tests...${NC}"
          npm test "features/$feature" 2>&1 | codex-report "Test execution"
          ;;
        "build")
          echo -e "${BLUE}Running build...${NC}"
          npm run build 2>&1 | codex-report "Build execution"
          ;;
        "analyze")
          echo -e "${BLUE}Analyzing...${NC}"
          npm run arch:validate 2>&1 | codex-report "Architecture analysis"
          ;;
        *)
          echo -e "${RED}Unknown action: $action${NC}"
          ;;
      esac
      
      echo -e "${GREEN}✅ Action complete, waiting for next request...${NC}"
      echo ""
    fi
    
    sleep 3
  done
}

# ============================================================================
# CODEX-STATUS: Show current context status
# ============================================================================
codex-status() {
  echo -e "${BLUE}📊 Current AI Context:${NC}"
  echo ""
  
  if [ ! -f "$CONTEXT_FILE" ]; then
    echo -e "${YELLOW}No active context${NC}"
    return
  fi
  
  local task=$(get_context_field "currentTask")
  local feature=$(get_context_field "feature")
  local phase=$(get_context_field "phase")
  local status=$(get_context_field "windsurfStatus")
  local action=$(get_context_field "nextAction")
  
  echo -e "Task:     ${GREEN}$task${NC}"
  [ -n "$feature" ] && echo -e "Feature:  ${GREEN}$feature${NC}"
  [ -n "$phase" ] && echo -e "Phase:    ${GREEN}$phase${NC}"
  [ -n "$status" ] && echo -e "Status:   ${GREEN}$status${NC}"
  [ -n "$action" ] && [ "$action" != "null" ] && echo -e "Pending:  ${YELLOW}$action${NC}"
  
  echo ""
  
  # Check if Codex has responded
  local codex_command=$(get_context | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf-8')).codexFeedback?.command || ''")
  if [ -n "$codex_command" ]; then
    echo -e "${BLUE}Last Codex feedback:${NC}"
    echo -e "  Command: $codex_command"
    local success=$(get_context | node -pe "JSON.parse(require('fs').readFileSync(0, 'utf-8')).codexFeedback?.success")
    if [ "$success" = "true" ]; then
      echo -e "  Result:  ${GREEN}✅ Success${NC}"
    else
      echo -e "  Result:  ${RED}❌ Failed${NC}"
    fi
  fi
}

# ============================================================================
# Export functions for use in other scripts
# ============================================================================
export -f get_context
export -f get_context_field
export -f codex-aware
export -f codex-report
export -f codex-validate
export -f codex-watch
export -f codex-status

# ============================================================================
# CLI usage
# ============================================================================
if [ "$1" = "watch" ]; then
  codex-watch
elif [ "$1" = "status" ]; then
  codex-status
elif [ "$1" = "validate" ]; then
  codex-validate "${2:-current}"
else
  echo "Codex Helper Scripts"
  echo ""
  echo "Usage:"
  echo "  source scripts/codex-helpers.sh    # Load functions"
  echo "  codex-aware <question>             # Ask Codex with context"
  echo "  codex-report <prompt>              # Run Codex and report to Windsurf"
  echo "  codex-validate [step]              # Validate migration step"
  echo "  bash scripts/codex-helpers.sh watch    # Start watcher"
  echo "  bash scripts/codex-helpers.sh status   # Show context status"
  echo ""
  echo "Example:"
  echo "  codex-aware 'Should I run tests now?'"
  echo "  codex-validate tests"
  echo "  bash scripts/codex-helpers.sh watch"
fi
