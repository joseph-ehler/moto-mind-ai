#!/bin/bash

# Debug Vision Response - Capture raw GPT-4o output
# Usage: ./debug-vision-response.sh <image-filename>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <image-filename>"
    echo "Example: $0 dashboard-audi-audi-a4-a9ed58-1024.jpg"
    exit 1
fi

IMAGE_FILE="$1"
TRAINING_DATA_PATH="$(dirname "$0")/../training-data"
IMAGE_PATH="$TRAINING_DATA_PATH/dashboards/raw/$IMAGE_FILE"
RESULTS_PATH="$TRAINING_DATA_PATH/dashboards/test-results"

# Check if image exists
if [ ! -f "$IMAGE_PATH" ]; then
    echo "❌ Image not found: $IMAGE_PATH"
    exit 1
fi

# Create results directory
mkdir -p "$RESULTS_PATH"

echo "🔍 Debugging vision response for: $IMAGE_FILE"
echo "📁 Image path: $IMAGE_PATH"

# Test server connectivity
echo "🔍 Checking server..."
if ! curl -s http://localhost:3005/ > /dev/null; then
    echo "❌ Server not running on localhost:3005"
    echo "💡 Start with: npm run dev"
    exit 1
fi

echo "✅ Server is running"

# Process image and capture detailed response
echo "🚀 Processing through vision system..."

RESULT_FILE="$RESULTS_PATH/$(basename "$IMAGE_FILE" | sed 's/\.[^.]*$//').debug.json"

# Use verbose curl to get full response
curl -X POST \
  -F "image=@$IMAGE_PATH" \
  -F "document_type=dashboard_snapshot" \
  -F "mode=auto" \
  http://localhost:3005/api/vision/process \
  -o "$RESULT_FILE" \
  -w "HTTP Status: %{http_code}\nTotal Time: %{time_total}s\n" \
  -v 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Processing complete"
    echo "📁 Debug result saved to: $RESULT_FILE"
    echo ""
    echo "🔍 RAW RESPONSE ANALYSIS:"
    
    # Check if jq is available for pretty printing
    if command -v jq > /dev/null; then
        echo "📊 SUCCESS STATUS:"
        jq -r '.success' "$RESULT_FILE" 2>/dev/null || echo "Could not parse success status"
        
        echo ""
        echo "📊 EXTRACTED ODOMETER:"
        jq -r '.data.key_facts.odometer_miles' "$RESULT_FILE" 2>/dev/null || echo "Could not parse odometer"
        
        echo ""
        echo "📊 FULL KEY FACTS:"
        jq '.data.key_facts' "$RESULT_FILE" 2>/dev/null || echo "Could not parse key facts"
        
        echo ""
        echo "📊 PROCESSING METADATA:"
        jq '.metadata' "$RESULT_FILE" 2>/dev/null || echo "Could not parse metadata"
        
    else
        echo "📄 Full response (install jq for better formatting):"
        cat "$RESULT_FILE"
    fi
else
    echo "❌ Processing failed"
    exit 1
fi
