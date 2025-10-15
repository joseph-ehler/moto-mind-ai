#!/bin/bash

# Test odometer reading only - simplified prompt
# Usage: ./test-odometer-only.sh <image-filename>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <image-filename>"
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

mkdir -p "$RESULTS_PATH"

echo "🔍 Testing ODOMETER READING ONLY for: $IMAGE_FILE"

# Create a simple JSON request for direct OpenAI Vision API test
cat > /tmp/odometer_test.json << 'EOF'
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Look at this dashboard image. Find the ODOMETER display (shows total miles/kilometers driven). Read the COMPLETE number - ALL digits visible. Do not truncate or read partial numbers.\n\nRespond with ONLY the complete odometer reading and unit, like:\n127856 km\nor\n85432 miles\n\nIf you see km, also convert to miles (divide by 1.609)."
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,IMAGE_BASE64_HERE"
          }
        }
      ]
    }
  ],
  "max_tokens": 100
}
EOF

# Convert image to base64
IMAGE_BASE64=$(base64 -i "$IMAGE_PATH")

# Replace placeholder with actual base64
sed -i '' "s/IMAGE_BASE64_HERE/$IMAGE_BASE64/g" /tmp/odometer_test.json

echo "🚀 Calling OpenAI Vision API directly..."

# Call OpenAI API directly
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d @/tmp/odometer_test.json \
  -o "$RESULTS_PATH/odometer_direct_test.json"

if [ $? -eq 0 ]; then
    echo "✅ Direct API call complete"
    echo ""
    echo "🔍 DIRECT GPT-4O RESPONSE:"
    
    if command -v jq > /dev/null; then
        jq -r '.choices[0].message.content' "$RESULTS_PATH/odometer_direct_test.json" 2>/dev/null || echo "Could not parse response"
    else
        cat "$RESULTS_PATH/odometer_direct_test.json"
    fi
else
    echo "❌ Direct API call failed"
    echo "💡 Make sure OPENAI_API_KEY is set"
fi

# Cleanup
rm -f /tmp/odometer_test.json
