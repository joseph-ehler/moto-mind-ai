#!/bin/bash
# Organize docs/ directory into logical structure
# Run this from project root: bash scripts/organize-docs.sh

set -e

echo "🗂️  Organizing docs/ directory..."

# Create directory structure
mkdir -p docs/guides/{getting-started,deployment,integration}
mkdir -p docs/architecture/{decisions,patterns,diagrams}
mkdir -p docs/features/{vision,vehicles,timeline,events,capture,auth,chat,insights}
mkdir -p docs/development/{setup,testing,migrations,workflows}
mkdir -p docs/operations/{deployment,monitoring,troubleshooting}

echo "✅ Created directory structure"

# Move files by pattern
echo "📦 Moving files by category..."

# Architecture & Design Decisions
git mv docs/*ARCHITECTURE*.md docs/architecture/ 2>/dev/null || true
git mv docs/*DECISION*.md docs/architecture/decisions/ 2>/dev/null || true
git mv docs/*PATTERN*.md docs/architecture/patterns/ 2>/dev/null || true
git mv docs/*DESIGN*.md docs/architecture/patterns/ 2>/dev/null || true

# Feature-specific docs
git mv docs/*VISION*.md docs/features/vision/ 2>/dev/null || true
git mv docs/*VEHICLE*.md docs/features/vehicles/ 2>/dev/null || true
git mv docs/*TIMELINE*.md docs/features/timeline/ 2>/dev/null || true
git mv docs/*EVENT*.md docs/features/events/ 2>/dev/null || true
git mv docs/*CAPTURE*.md docs/features/capture/ 2>/dev/null || true
git mv docs/*AUTH*.md docs/features/auth/ 2>/dev/null || true
git mv docs/*CHAT*.md docs/features/chat/ 2>/dev/null || true
git mv docs/*INSIGHT*.md docs/features/insights/ 2>/dev/null || true

# Deployment & Operations
git mv docs/*DEPLOY*.md docs/operations/deployment/ 2>/dev/null || true
git mv docs/*PRODUCTION*.md docs/operations/deployment/ 2>/dev/null || true
git mv docs/*VERCEL*.md docs/operations/deployment/ 2>/dev/null || true
git mv docs/*MONITOR*.md docs/operations/monitoring/ 2>/dev/null || true

# Development docs
git mv docs/*MIGRATION*.md docs/development/migrations/ 2>/dev/null || true
git mv docs/*TEST*.md docs/development/testing/ 2>/dev/null || true
git mv docs/*VALIDATION*.md docs/development/testing/ 2>/dev/null || true
git mv docs/*WINDSURF*.md docs/development/workflows/ 2>/dev/null || true
git mv docs/*CASCADE*.md docs/development/workflows/ 2>/dev/null || true

# Guides
git mv docs/*GUIDE*.md docs/guides/ 2>/dev/null || true
git mv docs/*QUICKSTART*.md docs/guides/getting-started/ 2>/dev/null || true
git mv docs/*SETUP*.md docs/guides/getting-started/ 2>/dev/null || true
git mv docs/*INTEGRATION*.md docs/guides/integration/ 2>/dev/null || true

# UI/UX docs
git mv docs/*UI*.md docs/architecture/patterns/ 2>/dev/null || true
git mv docs/*UX*.md docs/architecture/patterns/ 2>/dev/null || true

# Move remaining feature docs
git mv docs/*WEEK*.md docs/development/migrations/ 2>/dev/null || true
git mv docs/*PHASE*.md docs/development/migrations/ 2>/dev/null || true
git mv docs/*COMPLETE*.md docs/development/migrations/ 2>/dev/null || true
git mv docs/*TRANSFORMATION*.md docs/development/migrations/ 2>/dev/null || true

# Weekly plans and progress
git mv docs/*week*.md docs/development/workflows/ 2>/dev/null || true
git mv docs/*week*.json docs/development/workflows/ 2>/dev/null || true

echo "✅ Files organized by category"
echo ""
echo "📊 Summary:"
find docs -type d -maxdepth 2 | while read dir; do
  count=$(find "$dir" -maxdepth 1 -type f -name "*.md" 2>/dev/null | wc -l)
  if [ $count -gt 0 ]; then
    echo "  $dir: $count files"
  fi
done

echo ""
echo "🎉 Done! Commit with:"
echo "  git commit -m 'refactor: organize docs into logical directory structure'"
