#!/bin/bash

# Helper script to migrate API routes from Pages Router to App Router
# Usage: ./scripts/migrate-api-route-helper.sh pages/api/events/save.ts

set -e

OLD_FILE=$1

if [ -z "$OLD_FILE" ]; then
  echo "Usage: $0 <pages/api/route.ts>"
  exit 1
fi

# Calculate new path
# pages/api/events/save.ts → app/api/events/save/route.ts
# pages/api/events/[id].ts → app/api/events/[id]/route.ts
# pages/api/events/[id]/delete.ts → app/api/events/[id]/delete/route.ts

NEW_FILE=$(echo "$OLD_FILE" | sed 's|pages/api/|app/api/|' | sed 's|\.ts$|/route.ts|')

echo "📦 Migrating:"
echo "  FROM: $OLD_FILE"
echo "  TO:   $NEW_FILE"

# Create directory
NEW_DIR=$(dirname "$NEW_FILE")
mkdir -p "$NEW_DIR"

echo "✅ Directory created: $NEW_DIR"
echo "⚠️  Now manually migrate the file"
echo ""
echo "Key changes needed:"
echo "  1. import { NextRequest, NextResponse } from 'next/server'"
echo "  2. export async function GET/POST/PUT/DELETE(request, { params })"
echo "  3. params from context, not req.query"
echo "  4. await request.json() for body"
echo "  5. NextResponse.json() for responses"
echo ""
