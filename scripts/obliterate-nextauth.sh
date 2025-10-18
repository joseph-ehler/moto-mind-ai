#!/bin/bash
# Obliterate NextAuth from the codebase
# Run this to completely remove all NextAuth references

echo "🔥 OBLITERATING NEXTAUTH..."

# Delete NextAuth-specific files
echo "📁 Deleting NextAuth files..."
rm -f types/next-auth.d.ts
rm -f lib/auth/config.ts
rm -f components/providers/SessionProvider.tsx

# Delete old auth components that use NextAuth
echo "📁 Deleting old auth components..."
rm -f components/auth/AuthForm.tsx
rm -f components/auth/UnverifiedEmailBanner.tsx
rm -f components/layout/Navigation.tsx

# Delete old settings pages that use NextAuth
echo "📁 Deleting old settings pages..."
rm -rf app/settings

# Delete old API routes that use NextAuth
echo "📁 Deleting old API routes..."
rm -f app/api/user/notifications/route.ts
rm -f app/api/user/profile/route.ts
rm -f app/api/user/security-events/route.ts

# Delete old helper files
echo "📁 Deleting old helper files..."
rm -f lib/auth/client.ts
rm -f lib/auth/server.ts
rm -f lib/middleware/auth.ts
rm -f lib/middleware/tenant-context.ts

# Delete old hooks
echo "📁 Deleting old hooks..."
rm -f hooks/useCurrentUser.ts

# Delete test files referencing NextAuth
echo "📁 Deleting old test files..."
rm -f tests/integration/auth/rate-limiting-flow.test.ts
rm -f tests/integration/api-tenant-isolation.test.ts

# Delete temp pages
echo "📁 Deleting temp pages..."
rm -rf .temp-pages

# Delete old landing page
echo "📁 Deleting old landing page..."
rm -f "app/(landing)/page.tsx"

echo "✅ NextAuth files deleted!"
echo ""
echo "🔍 Remaining references (if any):"
grep -r "next-auth" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next . | grep -v "obliterate-nextauth.sh" || echo "  None! 🎉"
