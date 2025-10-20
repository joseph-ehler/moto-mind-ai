#!/bin/bash
# Move root .md files to appropriate docs/ subdirectories

echo "📚 Moving root .md files to docs/ subdirectories..."
echo ""

# Create necessary directories
mkdir -p docs/project-management/phases
mkdir -p docs/features/onboarding
mkdir -p docs/operations
mkdir -p docs/audits

# Phase documents
echo "Moving phase documents..."
mv -v PHASE_*.md docs/project-management/phases/ 2>/dev/null || true

# Integration/completion documents  
echo "Moving completion documents..."
mv -v *_COMPLETE*.md docs/project-management/phases/ 2>/dev/null || true
mv -v INTEGRATION_COMPLETE.md docs/project-management/phases/ 2>/dev/null || true

# Ship/deployment documents
echo "Moving deployment documents..."
mv -v SHIP_*.md docs/operations/ 2>/dev/null || true
mv -v TYPE_GENERATION_SETUP.md docs/operations/ 2>/dev/null || true

# Audit documents
echo "Moving audit documents..."
mv -v ONBOARDING_AUDIT.md docs/audits/ 2>/dev/null || true

# Status/progress documents
echo "Moving status documents..."
mv -v WHERE_WE_LEFT_OFF.md docs/project-management/ 2>/dev/null || true
mv -v *_PROGRESS.md docs/project-management/ 2>/dev/null || true
mv -v *_SUMMARY.md docs/project-management/ 2>/dev/null || true

# Cleanup/plan documents
echo "Moving cleanup/plan documents..."
mv -v *_CLEANUP_*.md docs/project-management/ 2>/dev/null || true
mv -v *_PLAN.md docs/project-management/ 2>/dev/null || true

# Roadmap documents
echo "Moving roadmap documents..."
mv -v *_ROADMAP.md docs/project-management/ 2>/dev/null || true

# Context documents
echo "Moving context documents..."
mv -v .windsurf-context.md docs/project-management/ 2>/dev/null || true
mv -v EMBEDDED_IN_CASCADE.md docs/project-management/ 2>/dev/null || true

echo ""
echo "✅ Root .md files moved!"
echo ""
echo "Remaining root files:"
find . -maxdepth 1 -name "*.md" -type f
echo ""
echo "💡 Only README.md and CONTRIBUTING.md should remain in root"
