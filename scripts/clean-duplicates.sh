#!/bin/bash
#
# DUPLICATE FILE CLEANER
#
# Automatically finds and archives identical duplicate files
# between components/ and features/ directories
#
# Strategy:
# - Keep: features/* (modern structure)
# - Archive: components/* (old structure)
#
# Safety: Uses diff to verify files are IDENTICAL before archiving
#

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_FOUND=0
TOTAL_IDENTICAL=0
TOTAL_DIFFERENT=0
TOTAL_ARCHIVED=0
TOTAL_LINES_CLEANED=0

# Arrays to store results
declare -a IDENTICAL_FILES
declare -a DIFFERENT_FILES
declare -a ARCHIVED_FILES

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🧹 DUPLICATE FILE CLEANER                            ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Find all duplicate filenames
echo "📊 Step 1: Scanning for duplicate filenames..."
echo ""

DUPLICATES=$(find components/ features/ -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | \
  grep -v test | \
  grep -v __tests__ | \
  grep -v ".broken" | \
  sed 's|.*/||' | \
  sort | \
  uniq -d)

TOTAL_FOUND=$(echo "$DUPLICATES" | wc -l | tr -d ' ')

echo -e "${BLUE}Found $TOTAL_FOUND duplicate filenames${NC}"
echo ""

# Step 2: Check each duplicate for identity
echo "🔍 Step 2: Checking for identical content..."
echo ""

while IFS= read -r filename; do
  # Find all instances of this filename
  COMP_FILE=$(find components/ -name "$filename" -type f 2>/dev/null | grep -v ".broken" | head -1)
  FEAT_FILE=$(find features/ -name "$filename" -type f 2>/dev/null | grep -v ".broken" | head -1)
  
  if [ -z "$COMP_FILE" ] || [ -z "$FEAT_FILE" ]; then
    continue
  fi
  
  # Check if identical
  if diff -q "$COMP_FILE" "$FEAT_FILE" >/dev/null 2>&1; then
    # IDENTICAL!
    LINES=$(wc -l < "$COMP_FILE" | tr -d ' ')
    IDENTICAL_FILES+=("$filename|$COMP_FILE|$FEAT_FILE|$LINES")
    TOTAL_IDENTICAL=$((TOTAL_IDENTICAL + 1))
    echo -e "${GREEN}✅ IDENTICAL:${NC} $filename ($LINES lines)"
  else
    # DIFFERENT
    DIFFERENT_FILES+=("$filename|$COMP_FILE|$FEAT_FILE")
    TOTAL_DIFFERENT=$((TOTAL_DIFFERENT + 1))
    echo -e "${YELLOW}⚠️  DIFFERENT:${NC} $filename"
  fi
done <<< "$DUPLICATES"

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Identical:${NC} $TOTAL_IDENTICAL files"
echo -e "${YELLOW}⚠️  Different:${NC} $TOTAL_DIFFERENT files"
echo ""

# Ask for confirmation before archiving
if [ $TOTAL_IDENTICAL -eq 0 ]; then
  echo "No identical duplicates found. Nothing to archive."
  exit 0
fi

echo "📦 Step 3: Archive identical duplicates?"
echo ""
echo "This will:"
echo "  - Archive $TOTAL_IDENTICAL files from components/ to archive/components-old/"
echo "  - Keep features/ versions (modern structure)"
echo "  - Run build validation"
echo ""
read -p "Proceed with archiving? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Aborted by user"
  exit 1
fi

# Step 3: Archive identical files
echo ""
echo "📦 Archiving identical duplicates..."
echo ""

for entry in "${IDENTICAL_FILES[@]}"; do
  IFS='|' read -r filename comp_file feat_file lines <<< "$entry"
  
  # Determine subdirectory structure
  RELATIVE_PATH=$(dirname "${comp_file#components/}")
  ARCHIVE_DIR="archive/components-old/$RELATIVE_PATH"
  
  # Create archive directory
  mkdir -p "$ARCHIVE_DIR"
  
  # Move file
  if mv "$comp_file" "$ARCHIVE_DIR/"; then
    ARCHIVED_FILES+=("$filename|$lines")
    TOTAL_ARCHIVED=$((TOTAL_ARCHIVED + 1))
    TOTAL_LINES_CLEANED=$((TOTAL_LINES_CLEANED + lines))
    echo -e "${GREEN}✅ Archived:${NC} $filename ($lines lines)"
  else
    echo -e "${RED}❌ Failed:${NC} $filename"
  fi
done

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 4: Validate
echo "🧪 Step 4: Running validation..."
echo ""

if npm run build >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Build passed${NC}"
else
  echo -e "${RED}❌ Build failed${NC}"
  echo ""
  echo "⚠️  Build validation failed. You may need to:"
  echo "  1. Check for missing imports"
  echo "  2. Restore files from archive if needed"
  echo "  3. Review changes manually"
  exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     ✅ CLEANUP COMPLETE!                                 ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Summary
echo "📊 SUMMARY"
echo ""
echo "Files Scanned:       $TOTAL_FOUND duplicates"
echo "Identical Found:     $TOTAL_IDENTICAL files"
echo "Files Archived:      $TOTAL_ARCHIVED files"
echo "Lines Cleaned:       $TOTAL_LINES_CLEANED lines"
echo ""

# Generate report
REPORT_FILE="docs/DUPLICATE_CLEANUP_REPORT.md"

cat > "$REPORT_FILE" << EOF
# 🧹 Duplicate File Cleanup Report

**Date:** $(date '+%Y-%m-%d %H:%M:%S')  
**Script:** scripts/clean-duplicates.sh  
**Status:** ✅ Complete

---

## 📊 SUMMARY

- **Duplicates Scanned:** $TOTAL_FOUND files
- **Identical Found:** $TOTAL_IDENTICAL files
- **Files Archived:** $TOTAL_ARCHIVED files
- **Lines Cleaned:** $TOTAL_LINES_CLEANED lines

---

## ✅ ARCHIVED FILES

EOF

for entry in "${ARCHIVED_FILES[@]}"; do
  IFS='|' read -r filename lines <<< "$entry"
  echo "- $filename ($lines lines)" >> "$REPORT_FILE"
done

cat >> "$REPORT_FILE" << EOF

---

## ⚠️  DIFFERENT FILES (Not Archived)

These files have the same name but different content.
Manual review recommended.

EOF

for entry in "${DIFFERENT_FILES[@]}"; do
  IFS='|' read -r filename comp_file feat_file <<< "$entry"
  echo "- $filename" >> "$REPORT_FILE"
  echo "  - components: \`$comp_file\`" >> "$REPORT_FILE"
  echo "  - features: \`$feat_file\`" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
done

cat >> "$REPORT_FILE" << EOF

---

## ✅ VALIDATION

- **Build Status:** Passed ✅
- **Quality Check:** Run \`./scripts/cascade-tools.sh quality\`

---

**Cleanup Complete!** 🎉
EOF

echo "📄 Report saved to: $REPORT_FILE"
echo ""
echo "🎯 Next Steps:"
echo "  1. Review the report"
echo "  2. Run: ./scripts/cascade-tools.sh quality"
echo "  3. Commit: git add archive/ docs/ && git commit -m 'refactor: automated duplicate cleanup'"
echo ""
echo "🎉 Done!"
echo ""
