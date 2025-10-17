#!/bin/bash

# Test Auth Flow
# Checks if last login method tracking is working

echo "🧪 Testing Auth Flow"
echo "===================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if dev server is running
echo "1. Checking if dev server is running..."
if curl -s http://localhost:3005 > /dev/null; then
    echo -e "${GREEN}✓${NC} Dev server is running"
else
    echo -e "${RED}✗${NC} Dev server is not running"
    echo ""
    echo "Please start the dev server:"
    echo "  npm run dev"
    exit 1
fi

echo ""

# Test debug endpoint
echo "2. Running debug checks..."
RESPONSE=$(curl -s http://localhost:3005/api/auth/debug)

if echo "$RESPONSE" | grep -q '"all_tests_passed":true'; then
    echo -e "${GREEN}✓${NC} All database checks passed"
else
    echo -e "${RED}✗${NC} Some database checks failed"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "Please run the migration:"
    echo "  1. Open: https://supabase.com/dashboard/project/ucbbzzoimghnaoihyqbd/sql/new"
    echo "  2. Paste contents of: supabase/migrations/20251017_01_auth_enhancements_day1_fixed.sql"
    echo "  3. Click 'Run'"
    exit 1
fi

echo ""

# Test preferences API
echo "3. Testing preferences API..."
TEST_EMAIL="test@example.com"
PREF_RESPONSE=$(curl -s "http://localhost:3005/api/auth/preferences?email=$TEST_EMAIL")

if echo "$PREF_RESPONSE" | grep -q 'lastMethod'; then
    echo -e "${GREEN}✓${NC} Preferences API is working"
    echo "   Response: $PREF_RESPONSE"
else
    echo -e "${RED}✗${NC} Preferences API failed"
    echo "   Response: $PREF_RESPONSE"
fi

echo ""

# Instructions
echo "===================="
echo ""
echo -e "${YELLOW}📋 MANUAL TESTING STEPS:${NC}"
echo ""
echo "1. Open browser console (F12 → Console tab)"
echo ""
echo "2. Go to: http://localhost:3005/auth/signin"
echo ""
echo "3. Enter your email in the email field"
echo "   → You should see console logs: [useLastLogin] Fetching for email..."
echo ""
echo "4. Sign in with any method (Google/Email/Password)"
echo "   → You should see console log in server: [AUTH] Track login"
echo ""
echo "5. Sign out (if applicable)"
echo ""
echo "6. Return to: http://localhost:3005/auth/signin"
echo ""
echo "7. Enter THE SAME email"
echo "   → You should see:"
echo "     - Console: [useLastLogin] Using cached method: [method]"
echo "     - Welcome back message"
echo "     - Highlighted button"
echo ""
echo "===================="
echo ""
echo -e "${GREEN}✓ Setup checks complete!${NC}"
echo ""
echo "Look for console logs starting with:"
echo "  - [AuthForm Debug]"
echo "  - [useLastLogin]"
echo "  - [LOGIN_PREFS]"
echo ""
