#!/bin/bash

# Test a single dashboard image through the vision system
# Usage: ./test-single-image.sh <image-filename>

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

echo "🧪 Testing dashboard image: $IMAGE_FILE"
echo "📁 Image path: $IMAGE_PATH"

# Test server connectivity
echo "🔍 Checking server..."
if ! curl -s http://localhost:3005/ > /dev/null; then
    echo "❌ Server not running on localhost:3005"
    echo "💡 Start with: npm run dev"
    exit 1
fi

echo "✅ Server is running"

# Process image through vision API
echo "🚀 Processing through vision system..."

RESULT_FILE="$RESULTS_PATH/$(basename "$IMAGE_FILE" | sed 's/\.[^.]*$//').result.json"

curl -X POST \
  -F "image=@$IMAGE_PATH" \
  -F "document_type=dashboard_snapshot" \
  -F "mode=auto" \
  http://localhost:3005/api/vision/process \
  -o "$RESULT_FILE" \
  -w "HTTP Status: %{http_code}\n"

if [ $? -eq 0 ]; then
    echo "✅ Processing complete"
    echo "📁 Result saved to: $RESULT_FILE"
    echo ""
    echo "📊 EXTRACTED DATA:"
    # Pretty print the JSON result
    if command -v jq > /dev/null; then
        jq '.data.key_facts' "$RESULT_FILE" 2>/dev/null || cat "$RESULT_FILE"
    else
        cat "$RESULT_FILE"
    fi
else
    echo "❌ Processing failed"
    exit 1
fi
