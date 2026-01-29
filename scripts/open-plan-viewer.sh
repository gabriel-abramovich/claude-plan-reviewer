#!/bin/bash
# PostToolUse hook to open Plan Review App when plan files are written
# This replaces the old plan-viewer.sh hook with the new React app

INPUT=$(cat)

# Check if this is a plan file being written
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only trigger for plan files
if [[ ! "$FILE_PATH" == *".claude/plans"* ]]; then
  exit 0
fi

PORT=3334
APP_DIR="$HOME/.claude/plan-viewer-app"
PLAN_ID=$(basename "$FILE_PATH" .md)

# Log for debugging
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") Plan written: $FILE_PATH" >> "$HOME/.claude/plan-viewer-debug.log"

# Check if dev server is running
if lsof -i :$PORT > /dev/null 2>&1; then
  # Server is running, just notify it of file change and open browser
  curl -s -X POST "http://localhost:$PORT/api/plans/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"path\": \"$FILE_PATH\"}" > /dev/null 2>&1

  # Open browser to specific plan
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:$PORT?plan=$PLAN_ID" 2>/dev/null
  else
    xdg-open "http://localhost:$PORT?plan=$PLAN_ID" 2>/dev/null
  fi

  exit 0
fi

# Server not running - start it
if [ -d "$APP_DIR" ] && [ -f "$APP_DIR/package.json" ]; then
  cd "$APP_DIR"

  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") Installing dependencies..." >> "$HOME/.claude/plan-viewer-debug.log"
    npm install > /dev/null 2>&1
  fi

  # Start the dev server in background
  echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") Starting plan viewer server..." >> "$HOME/.claude/plan-viewer-debug.log"
  npm run dev > "$HOME/.claude/plan-viewer-server.log" 2>&1 &

  # Wait for server to be ready
  for i in {1..10}; do
    if lsof -i :$PORT > /dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done

  # Open browser
  sleep 1
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:$PORT?plan=$PLAN_ID" 2>/dev/null
  else
    xdg-open "http://localhost:$PORT?plan=$PLAN_ID" 2>/dev/null
  fi
fi

exit 0
