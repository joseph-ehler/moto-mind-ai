#!/bin/bash

# Auth Test Runner
# Runs all authentication tests with proper configuration

echo "🧪 Running Authentication Tests"
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Run unit tests
echo ""
echo "📦 Running Unit Tests..."
npm run test -- tests/unit/auth

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Unit tests passed${NC}"
else
    echo -e "${RED}✗ Unit tests failed${NC}"
    exit 1
fi

# Run integration tests
echo ""
echo "🔗 Running Integration Tests..."
npm run test:integration -- tests/integration/auth

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Integration tests passed${NC}"
else
    echo -e "${RED}✗ Integration tests failed${NC}"
    exit 1
fi

# Generate coverage report
echo ""
echo "📊 Generating Coverage Report..."
npm run test -- tests/unit/auth tests/integration/auth --coverage

echo ""
echo -e "${GREEN}✅ All auth tests passed!${NC}"
