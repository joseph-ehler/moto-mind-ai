#!/bin/bash
# Phase 3: Final cleanup - move everything remaining to appropriate homes
# Anything left gets archived or categorized

set -e

echo "🗂️  Phase 3: Final cleanup..."

# Create final categories
mkdir -p docs/features/ui-polish
mkdir -p docs/features/performance
mkdir -p docs/features/routing
mkdir -p docs/features/images
mkdir -p docs/archive/2025/misc

echo "✅ Created final directories"
echo "📦 Moving remaining files..."

# UI/Visual features
git mv docs/*HERO*.md docs/features/ui-polish/ 2>/dev/null || true
git mv docs/*ELEVATION*.md docs/features/ui-polish/ 2>/dev/null || true
git mv docs/*FROSTED*.md docs/features/ui-polish/ 2>/dev/null || true
git mv docs/*DYNAMIC*.md docs/features/ui-polish/ 2>/dev/null || true
git mv docs/*ANIMATION*.md docs/features/ui-polish/ 2>/dev/null || true
git mv docs/*FAB*.md docs/features/ui-polish/ 2>/dev/null || true
git mv docs/*OVERLAY*.md docs/features/ui-polish/ 2>/dev/null || true
git mv docs/*BADGE*.md docs/features/ui-polish/ 2>/dev/null || true
git mv docs/*POPOVER*.md docs/features/ui-polish/ 2>/dev/null || true
git mv docs/*FIELD*.md docs/features/ui-polish/ 2>/dev/null || true
git mv docs/*LEGEND*.md docs/features/ui-polish/ 2>/dev/null || true
git mv docs/*EDITING*.md docs/features/ui-polish/ 2>/dev/null || true
git mv docs/*PREVIEW*.md docs/features/images/ 2>/dev/null || true

# Performance docs
git mv docs/*N1*.md docs/features/performance/ 2>/dev/null || true
git mv docs/*SLOW*.md docs/features/performance/ 2>/dev/null || true
git mv docs/*PERFORMANCE*.md docs/features/performance/ 2>/dev/null || true

# Routing docs
git mv docs/*ROUTING*.md docs/features/routing/ 2>/dev/null || true
git mv docs/*ROUTE*.md docs/features/routing/ 2>/dev/null || true

# Warning/Alert systems
git mv docs/*WARNING*.md docs/architecture/components/ 2>/dev/null || true
git mv docs/*LIGHT*.md docs/architecture/components/ 2>/dev/null || true

# Implementation/Status docs
git mv docs/*IMPLEMENTATION*.md docs/development/workflows/ 2>/dev/null || true
git mv docs/*STATUS*.md docs/development/workflows/ 2>/dev/null || true
git mv docs/*NEXT_STEPS*.md docs/development/workflows/ 2>/dev/null || true

# Timeline/RO Design docs
git mv docs/*timeline*.md docs/features/timeline/ 2>/dev/null || true
git mv docs/*ro-design*.md docs/architecture/patterns/ 2>/dev/null || true

# Enterprise docs
git mv docs/*enterprise*.md docs/development/workflows/ 2>/dev/null || true

# Move any remaining .md files to archive/misc
echo "📦 Archiving remaining misc docs..."
for file in docs/*.md; do
  if [ -f "$file" ]; then
    git mv "$file" docs/archive/2025/misc/ 2>/dev/null || true
  fi
done

echo "✅ Phase 3 complete!"
echo ""
echo "📊 Final summary:"
find docs -maxdepth 1 -type f -name "*.md" 2>/dev/null | wc -l | xargs echo "  Files in root:"

echo ""
echo "📂 Organized structure:"
find docs -type d -maxdepth 3 | sort | while read dir; do
  count=$(find "$dir" -maxdepth 1 -type f -name "*.md" 2>/dev/null | wc -l)
  if [ $count -gt 0 ]; then
    echo "  $dir: $count files"
  fi
done

echo ""
echo "🎉 All docs organized! Ready to commit."
