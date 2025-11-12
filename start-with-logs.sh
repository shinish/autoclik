#!/bin/bash

# AutoClik Platform - Start with Logging
# This script starts the development server and logs all output

# Create logs directory if it doesn't exist
mkdir -p logs

# Generate timestamp for log file
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="logs/server-$TIMESTAMP.log"

# Create symlink to latest log
ln -sf "server-$TIMESTAMP.log" logs/latest.log

echo "=================================="
echo "AutoClik Platform - Starting Server"
echo "=================================="
echo "Log file: $LOG_FILE"
echo "Latest log: logs/latest.log"
echo ""
echo "To view logs in real-time:"
echo "  tail -f logs/latest.log"
echo ""
echo "To view only errors:"
echo "  tail -f logs/latest.log | grep -i error"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================="
echo ""

# Start the server and log everything
npm run dev 2>&1 | tee "$LOG_FILE"
