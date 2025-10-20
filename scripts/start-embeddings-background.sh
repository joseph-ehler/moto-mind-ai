#!/bin/bash

# Start embedding generation in true background mode
# This will keep running even if terminal is closed

cd "$(dirname "$0")/.."

# Kill any existing process
pkill -f "generate-embeddings-parallel"

# Start with nohup (no hangup - survives terminal close)
nohup npm run safety:embed-parallel > logs/embeddings.log 2>&1 &

# Get process ID
PID=$!

echo "✅ Embedding generation started!"
echo "📋 Process ID: $PID"
echo "📝 Log file: logs/embeddings.log"
echo ""
echo "Commands:"
echo "  Monitor: tail -f logs/embeddings.log"
echo "  Status: npm run safety:embed-stats"
echo "  Stop: kill $PID"
echo ""
echo "💡 You can now close this terminal!"
