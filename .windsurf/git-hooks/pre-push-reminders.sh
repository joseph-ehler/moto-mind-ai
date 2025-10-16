#!/bin/bash
# Pre-push reminders for AI tools
# Install with: cp .windsurf/git-hooks/pre-push-reminders.sh .git/hooks/pre-push

echo ""
echo "🤖 =============================================="
echo "🤖  AI-POWERED PRE-PUSH REMINDERS"
echo "🤖 =============================================="
echo ""

# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Check if pushing to main/master
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  echo "⚠️  Pushing to $BRANCH branch!"
  echo ""
  echo "💡 Have you run Deploy Risk AI?"
  echo "   npm run deploy:risk:ai"
  echo ""
  echo "   This assesses deployment risk and recommends strategy."
  echo "   Takes 30 seconds. Can prevent production incidents."
  echo ""
  
  # Count changed files
  CHANGED=$(git diff origin/$BRANCH --name-only 2>/dev/null | wc -l)
  
  if [ $CHANGED -gt 10 ]; then
    echo "⚠️  Large push detected ($CHANGED files changed)"
    echo ""
    echo "💡 Consider also running:"
    echo "   npm run arch:validate:ai  (Architecture health check)"
    echo ""
  fi
  
  # Check for package.json changes
  if git diff origin/$BRANCH --name-only 2>/dev/null | grep -q "package.json"; then
    echo "⚠️  package.json changed"
    echo ""
    echo "💡 This affects dependencies. Deploy Risk AI will flag this."
    echo "   Make sure you've tested thoroughly!"
    echo ""
  fi
  
  # Check for database changes
  if git diff origin/$BRANCH --name-only 2>/dev/null | grep -q "supabase\|migrations"; then
    echo "⚠️  Database changes detected"
    echo ""
    echo "💡 Consider running:"
    echo "   npm run db:doctor:ai  (Database health check)"
    echo ""
  fi
  
  echo "✅ Pre-push reminders complete"
  echo ""
  echo "Press Enter to continue with push, or Ctrl+C to cancel..."
  read
else
  echo "✅ Pushing to feature branch: $BRANCH"
  echo "   (AI reminders only for main/master)"
  echo ""
fi

exit 0
