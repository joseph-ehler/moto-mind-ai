#!/bin/bash

# WINDSURF PERMISSION FIX
# Fixes macOS file permission issues that cause numbered file creation

PROJECT_DIR="/Users/josephehler/Desktop/Desktop/apps/motomind-ai"

echo "🔧 Fixing Windsurf file permissions..."

# Fix ownership
echo "👤 Setting correct ownership..."
chown -R josephehler:staff "$PROJECT_DIR"

# Fix permissions
echo "🔐 Setting correct permissions..."
chmod -R 755 "$PROJECT_DIR"

# Remove extended attributes that cause issues
echo "🧹 Removing extended attributes..."
xattr -cr "$PROJECT_DIR"

# Make scripts executable
echo "⚡ Making scripts executable..."
chmod +x "$PROJECT_DIR/scripts/"*.sh
chmod +x "$PROJECT_DIR/scripts/"*.js

echo "✅ Permission fix complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Restart Windsurf completely"
echo "2. Reopen the project"
echo "3. Check System Settings > Privacy & Security > Files and Folders"
echo "4. Ensure Windsurf has full access to your project directory"
