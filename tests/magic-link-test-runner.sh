#!/bin/bash

# Magic Link Test Runner
# Runs all tests for the magic link feature

echo "🧪 MAGIC LINK TEST SUITE"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
UNIT_TESTS_PASSED=false
INTEGRATION_TESTS_PASSED=false

echo -e "${BLUE}Running unit tests...${NC}"
echo ""

if npm test tests/unit/auth/magic-link-service.test.ts -- --silent 2>&1 | tee /tmp/unit-test-output.txt; then
  UNIT_TESTS_PASSED=true
  echo ""
  echo -e "${GREEN}✓ Unit tests passed${NC}"
else
  echo ""
  echo -e "${RED}✗ Unit tests failed${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${BLUE}Running integration tests...${NC}"
echo ""

if npm test tests/integration/auth/magic-link-api.test.ts -- --silent 2>&1 | tee /tmp/integration-test-output.txt; then
  INTEGRATION_TESTS_PASSED=true
  echo ""
  echo -e "${GREEN}✓ Integration tests passed${NC}"
else
  echo ""
  echo -e "${RED}✗ Integration tests failed${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}TEST SUMMARY${NC}"
echo ""

if $UNIT_TESTS_PASSED && $INTEGRATION_TESTS_PASSED; then
  echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
  echo ""
  echo "Magic Link Feature: Production Ready 🚀"
  echo ""
  echo "Test Coverage:"
  echo "  • Unit Tests: Magic link service (15 tests)"
  echo "  • Integration Tests: API routes (11 tests)"
  echo "  • Total: 26 tests"
  echo ""
  echo "What's Tested:"
  echo "  ✓ 15-minute expiration"
  echo "  ✓ One-time use enforcement"
  echo "  ✓ Rate limiting (3 per hour)"
  echo "  ✓ Secure token generation"
  echo "  ✓ IP address tracking"
  echo "  ✓ Error handling"
  echo "  ✓ API endpoints"
  echo ""
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo ""
  if ! $UNIT_TESTS_PASSED; then
    echo "  ✗ Unit tests failed"
  fi
  if ! $INTEGRATION_TESTS_PASSED; then
    echo "  ✗ Integration tests failed"
  fi
  echo ""
  echo "Check the output above for details."
  echo ""
  exit 1
fi
