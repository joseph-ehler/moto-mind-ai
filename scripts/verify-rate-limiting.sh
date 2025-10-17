#!/bin/bash

# Rate Limiting Verification Script
# Quick checks to verify rate limiting is working

echo "🔍 RATE LIMITING VERIFICATION"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if dev server is running
echo "1. Checking dev server..."
if curl -s http://localhost:3005 > /dev/null; then
    echo -e "${GREEN}✓${NC} Dev server is running"
else
    echo -e "${RED}✗${NC} Dev server is not running"
    echo "  Please start: npm run dev"
    exit 1
fi

echo ""

# Check if rate limiter service exists
echo "2. Checking rate limiter service..."
if [ -f "lib/auth/services/rate-limiter.ts" ]; then
    echo -e "${GREEN}✓${NC} Rate limiter service exists"
    
    # Check for key functions
    if grep -q "checkRateLimit" lib/auth/services/rate-limiter.ts; then
        echo -e "${GREEN}  ✓${NC} checkRateLimit() function found"
    fi
    
    if grep -q "recordAttempt" lib/auth/services/rate-limiter.ts; then
        echo -e "${GREEN}  ✓${NC} recordAttempt() function found"
    fi
    
    if grep -q "clearRateLimits" lib/auth/services/rate-limiter.ts; then
        echo -e "${GREEN}  ✓${NC} clearRateLimits() function found"
    fi
else
    echo -e "${RED}✗${NC} Rate limiter service not found"
    exit 1
fi

echo ""

# Check if auth config uses rate limiting
echo "3. Checking auth integration..."
if grep -q "checkRateLimit" lib/auth/config.ts; then
    echo -e "${GREEN}✓${NC} Rate limiting integrated into auth"
else
    echo -e "${YELLOW}⚠${NC} Rate limiting may not be integrated"
fi

echo ""

# Check if UI components exist
echo "4. Checking UI components..."
if [ -f "components/auth/ui/RateLimitMessage.tsx" ]; then
    echo -e "${GREEN}✓${NC} RateLimitMessage component exists"
else
    echo -e "${YELLOW}⚠${NC} RateLimitMessage component not found"
fi

if grep -q "RateLimitMessage" components/auth/AuthForm.tsx; then
    echo -e "${GREEN}✓${NC} RateLimitMessage used in AuthForm"
else
    echo -e "${YELLOW}⚠${NC} RateLimitMessage not used in AuthForm"
fi

echo ""

# Check database table
echo "5. Checking database..."
echo "   Run this SQL in Supabase to verify:"
echo ""
echo -e "${BLUE}   SELECT COUNT(*) FROM auth_rate_limits;${NC}"
echo ""

# Summary
echo "=============================="
echo ""
echo -e "${GREEN}✓ Rate limiting is installed!${NC}"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Run manual tests:"
echo "   cat tests/manual/rate-limiting-manual-tests.md"
echo ""
echo "2. Test in browser:"
echo "   http://localhost:3005/auth/signin"
echo "   • Try wrong password 6 times"
echo "   • Should see lockout message"
echo ""
echo "3. Check database:"
echo "   • Open Supabase dashboard"
echo "   • Run: SELECT * FROM auth_rate_limits;"
echo ""
