#!/bin/bash

# Rate Limiting Test Runner
# Runs all rate limiting tests with detailed output

echo "🧪 RATE LIMITING TEST SUITE"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}📋 Test Plan:${NC}"
echo "  1. Unit tests for rate limiter service (17 tests)"
echo "  2. Integration tests for auth flows (10 tests)"
echo ""
echo "  Total: 27 tests"
echo ""

# Function to run tests
run_test_suite() {
  local test_file=$1
  local test_name=$2
  
  echo -e "${YELLOW}▶ Running: ${test_name}${NC}"
  echo ""
  
  if npx jest "$test_file" --verbose --no-coverage 2>&1; then
    echo -e "${GREEN}✓ ${test_name} passed${NC}"
    echo ""
    return 0
  else
    echo -e "${RED}✗ ${test_name} failed${NC}"
    echo ""
    return 1
  fi
}

# Run Unit Tests
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. UNIT TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if run_test_suite "tests/unit/auth/rate-limiter.test.ts" "Rate Limiter Service"; then
  ((PASSED_TESTS++))
else
  ((FAILED_TESTS++))
fi

# Run Integration Tests
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}2. INTEGRATION TESTS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if run_test_suite "tests/integration/auth/rate-limiting-flow.test.ts" "Rate Limiting Flow"; then
  ((PASSED_TESTS++))
else
  ((FAILED_TESTS++))
fi

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TOTAL_SUITES=$((PASSED_TESTS + FAILED_TESTS))

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✓ All test suites passed!${NC}"
  echo ""
  echo "  Test Suites: ${GREEN}${PASSED_TESTS} passed${NC}, ${TOTAL_SUITES} total"
  echo "  Expected Tests: 27 total"
  echo ""
  echo -e "${GREEN}🎉 Rate limiting is working correctly!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some test suites failed${NC}"
  echo ""
  echo "  Test Suites: ${GREEN}${PASSED_TESTS} passed${NC}, ${RED}${FAILED_TESTS} failed${NC}, ${TOTAL_SUITES} total"
  echo ""
  echo -e "${YELLOW}⚠ Review failed tests above${NC}"
  exit 1
fi
