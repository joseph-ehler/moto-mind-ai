#!/bin/bash

# Script to restore archived components needed by the app

set -e

echo "🔧 Restoring archived components..."
echo ""

# Create necessary directories
mkdir -p components/{app,maps,location,modals,explain}

# Restore components
echo "Restoring app components..."
cp archive/components-old/app/* components/app/ 2>/dev/null || true

echo "Restoring maps components..."
cp archive/components-old/maps/* components/maps/ 2>/dev/null || true

echo "Restoring location components..."
cp archive/components-old/location/* components/location/ 2>/dev/null || true

echo "Restoring modals..."
cp archive/components-old/modals/* components/modals/ 2>/dev/null || true

echo "Restoring explain components..."
cp archive/components-old/explain/* components/explain/ 2>/dev/null || true

echo "Restoring PWA components..."
cp archive/components-old/PWAInstallPrompt.tsx components/ 2>/dev/null || true
cp archive/components-old/PWAManifestInjector.tsx components/ 2>/dev/null || true
cp archive/components-old/SetMaintenanceIntervalModal.tsx components/ 2>/dev/null || true

echo ""
echo "✅ Components restored!"
echo ""
echo "Summary:"
echo "- app/: $(ls components/app/ 2>/dev/null | wc -l) files"
echo "- maps/: $(ls components/maps/ 2>/dev/null | wc -l) files"
echo "- location/: $(ls components/location/ 2>/dev/null | wc -l) files"
echo "- modals/: $(ls components/modals/ 2>/dev/null | wc -l) files"
echo "- explain/: $(ls components/explain/ 2>/dev/null | wc -l) files"
