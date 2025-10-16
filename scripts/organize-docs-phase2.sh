#!/bin/bash
# Phase 2: Organize remaining docs files
# Handles all the edge cases and specific patterns

set -e

echo "🗂️  Phase 2: Deep docs organization..."

# Create more specific directories
mkdir -p docs/features/database
mkdir -p docs/features/location
mkdir -p docs/features/weather
mkdir -p docs/features/ai
mkdir -p docs/architecture/components
mkdir -p docs/architecture/schema
mkdir -p docs/development/debugging
mkdir -p docs/development/changelog

echo "✅ Created additional directories"
echo "📦 Moving remaining files..."

# Database docs
git mv docs/*DATABASE*.md docs/features/database/ 2>/dev/null || true
git mv docs/*database*.md docs/features/database/ 2>/dev/null || true
git mv docs/*SCHEMA*.md docs/architecture/schema/ 2>/dev/null || true
git mv docs/*schema*.md docs/architecture/schema/ 2>/dev/null || true

# Location/GPS/Address docs
git mv docs/*ADDRESS*.md docs/features/location/ 2>/dev/null || true
git mv docs/*LOCATION*.md docs/features/location/ 2>/dev/null || true
git mv docs/*GPS*.md docs/features/location/ 2>/dev/null || true
git mv docs/*GEOCOD*.md docs/features/location/ 2>/dev/null || true
git mv docs/*MAP*.md docs/features/location/ 2>/dev/null || true

# Weather docs
git mv docs/*WEATHER*.md docs/features/weather/ 2>/dev/null || true
git mv docs/*AUTO_UPDATE*.md docs/features/weather/ 2>/dev/null || true

# AI docs
git mv docs/*AI*.md docs/features/ai/ 2>/dev/null || true
git mv docs/*AUTONOMOUS*.md docs/features/ai/ 2>/dev/null || true
git mv docs/*canonical*.md docs/features/ai/ 2>/dev/null || true

# Component docs
git mv docs/*COMPONENT*.md docs/architecture/components/ 2>/dev/null || true
git mv docs/*ACTION_BAR*.md docs/architecture/components/ 2>/dev/null || true
git mv docs/*BREADCRUMB*.md docs/architecture/components/ 2>/dev/null || true
git mv docs/*CHECKBOX*.md docs/architecture/components/ 2>/dev/null || true
git mv docs/*COMBOBOX*.md docs/architecture/components/ 2>/dev/null || true
git mv docs/*DROPDOWN*.md docs/architecture/components/ 2>/dev/null || true
git mv docs/*DIALOG*.md docs/architecture/components/ 2>/dev/null || true
git mv docs/*TOAST*.md docs/architecture/components/ 2>/dev/null || true
git mv docs/*MODAL*.md docs/architecture/components/ 2>/dev/null || true
git mv docs/*CARD*.md docs/architecture/components/ 2>/dev/null || true

# Development/Debugging docs
git mv docs/*DEBUG*.md docs/development/debugging/ 2>/dev/null || true
git mv docs/*debug*.md docs/development/debugging/ 2>/dev/null || true
git mv docs/*CHANGELOG*.md docs/development/changelog/ 2>/dev/null || true
git mv docs/*changelog*.md docs/development/changelog/ 2>/dev/null || true

# API docs
git mv docs/*API*.md docs/architecture/ 2>/dev/null || true
git mv docs/*api*.md docs/architecture/ 2>/dev/null || true

# Fixes and improvements
git mv docs/*FIX*.md docs/development/debugging/ 2>/dev/null || true
git mv docs/*IMPROVEMENT*.md docs/development/workflows/ 2>/dev/null || true
git mv docs/*ENHANCEMENT*.md docs/development/workflows/ 2>/dev/null || true
git mv docs/*UPGRADE*.md docs/development/workflows/ 2>/dev/null || true

# Naming, organization, cleanup docs
git mv docs/*cleanup*.md docs/development/workflows/ 2>/dev/null || true
git mv docs/*organization*.md docs/development/workflows/ 2>/dev/null || true
git mv docs/*naming*.md docs/development/workflows/ 2>/dev/null || true
git mv docs/*analysis*.md docs/development/workflows/ 2>/dev/null || true

# Move anything with "current-" prefix (implementation docs)
git mv docs/current-*.md docs/development/workflows/ 2>/dev/null || true

# Move remaining JSON files
git mv docs/*.json docs/development/workflows/ 2>/dev/null || true

echo "✅ Phase 2 organization complete!"
echo ""
echo "📊 Remaining in root:"
remaining=$(find docs -maxdepth 1 -type f -name "*.md" 2>/dev/null | wc -l)
echo "  $remaining files"

if [ $remaining -gt 0 ]; then
  echo ""
  echo "📋 Files still in root:"
  find docs -maxdepth 1 -type f -name "*.md" | head -20
fi

echo ""
echo "🎉 Ready to commit!"
