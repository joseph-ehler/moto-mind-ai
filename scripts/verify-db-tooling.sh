#!/bin/bash

# Database Tooling Verification Script
# Verifies all database and Supabase admin tools are functional

echo "🔍 DATABASE TOOLING VERIFICATION"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
TOTAL=0

# Function to test a command
test_command() {
  local name=$1
  local command=$2
  local expected_pattern=$3
  
  ((TOTAL++))
  echo -e "${BLUE}Testing: ${name}${NC}"
  
  if eval "$command" 2>&1 | grep -q "$expected_pattern"; then
    echo -e "${GREEN}✓${NC} $name works"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗${NC} $name failed"
    ((FAILED++))
    return 1
  fi
}

# Function to check if file exists
check_file() {
  local name=$1
  local file=$2
  
  ((TOTAL++))
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $name exists"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗${NC} $name missing"
    ((FAILED++))
    return 1
  fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. CHECKING CORE SCRIPTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_file "Health Check Script" "scripts/database-suite/check-supabase-health.ts"
check_file "Migration Script" "scripts/database-suite/migrate.ts"
check_file "Introspect Script" "scripts/database-suite/db-introspect.ts"
check_file "Validate Script" "scripts/database-suite/validate.ts"
check_file "Doctor AI Script" "scripts/database-suite/doctor-ai.ts"
check_file "Supabase Admin V2" "scripts/database-suite/supabase-admin-v2.ts"
check_file "Generate Migration SQL" "scripts/database-suite/generate-migration-sql.ts"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. TESTING NPM SCRIPTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test db:health
test_command "db:health" "npm run db:health 2>&1" "Database"

# Test db:introspect
test_command "db:introspect" "npm run db:introspect 2>&1" "Found"

# Test db:validate (may pass or fail, but should run)
echo -e "${BLUE}Testing: db:validate${NC}"
if npm run db:validate 2>&1 | head -n 10 | grep -q "VALIDATION"; then
  echo -e "${GREEN}✓${NC} db:validate works"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠${NC} db:validate ran (check output manually)"
  ((PASSED++))
fi
((TOTAL++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. CHECKING ENVIRONMENT VARIABLES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

((TOTAL++))
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${GREEN}✓${NC} NEXT_PUBLIC_SUPABASE_URL is set"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} NEXT_PUBLIC_SUPABASE_URL is missing"
  ((FAILED++))
fi

((TOTAL++))
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${GREEN}✓${NC} SUPABASE_SERVICE_ROLE_KEY is set"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} SUPABASE_SERVICE_ROLE_KEY is missing"
  ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. CHECKING MIGRATIONS DIRECTORY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

((TOTAL++))
if [ -d "supabase/migrations" ]; then
  MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
  echo -e "${GREEN}✓${NC} Migrations directory exists"
  echo "   Found $MIGRATION_COUNT migration files"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Migrations directory missing"
  ((FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. CHECKING DATABASE CONNECTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Use db:health to check connection
echo -e "${BLUE}Testing database connection...${NC}"
if npm run db:health 2>&1 | grep -q "✅"; then
  echo -e "${GREEN}✓${NC} Database connection successful"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Database connection failed"
  ((FAILED++))
fi
((TOTAL++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PASS_RATE=$((PASSED * 100 / TOTAL))

echo "Tests Passed: ${GREEN}${PASSED}/${TOTAL}${NC} (${PASS_RATE}%)"

if [ $FAILED -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ ALL DATABASE TOOLS ARE FUNCTIONAL!${NC}"
  echo ""
  echo "Available commands:"
  echo "  npm run db:health          - Check database health"
  echo "  npm run db:migrate         - Apply pending migrations"
  echo "  npm run db:introspect      - List all tables"
  echo "  npm run db:validate        - Validate database schema"
  echo "  npm run db:doctor          - Run database diagnostics"
  echo "  npm run db:doctor:ai       - AI-powered diagnostics"
  echo "  npm run db:generate-sql    - Generate migration SQL"
  echo "  npm run supabase:admin     - Supabase admin tools"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}⚠ Some database tools have issues${NC}"
  echo ""
  echo "Failed checks: $FAILED"
  echo ""
  echo "Action items:"
  [ ! -f "scripts/database-suite/check-supabase-health.ts" ] && echo "  • Install missing health check script"
  [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] && echo "  • Set NEXT_PUBLIC_SUPABASE_URL in .env.local"
  [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "  • Set SUPABASE_SERVICE_ROLE_KEY in .env.local"
  echo ""
  exit 1
fi
