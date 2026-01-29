#!/bin/bash
# UserPromptSubmit hook to inject plan review comments into Claude context
# This hook reads unresolved comments from the most recently modified plan
# and includes them as additional context for Claude.

COMMENTS_DIR="$HOME/.claude/plan-comments"

# Read stdin (hook input)
INPUT=$(cat)

# Exit early if no comments directory
if [ ! -d "$COMMENTS_DIR" ]; then
  echo '{}'
  exit 0
fi

# Find the most recently modified comment file with unresolved comments
get_active_plan_comments() {
  local latest_file=""
  local latest_time=0

  for comment_file in "$COMMENTS_DIR"/*.json; do
    [ -f "$comment_file" ] || continue

    # Check if has unresolved comments using jq
    has_unresolved=$(jq -r '[.sections[].comments[] | select(.resolved == false)] | length > 0' "$comment_file" 2>/dev/null)

    if [ "$has_unresolved" = "true" ]; then
      # Get modification time (macOS vs Linux compatible)
      if [[ "$OSTYPE" == "darwin"* ]]; then
        mtime=$(stat -f %m "$comment_file" 2>/dev/null)
      else
        mtime=$(stat -c %Y "$comment_file" 2>/dev/null)
      fi

      if [ "$mtime" -gt "$latest_time" ]; then
        latest_time=$mtime
        latest_file="$comment_file"
      fi
    fi
  done

  echo "$latest_file"
}

ACTIVE_COMMENTS=$(get_active_plan_comments)

if [ -z "$ACTIVE_COMMENTS" ]; then
  # No active comments, exit cleanly
  echo '{}'
  exit 0
fi

# Build context from comments using jq
CONTEXT=$(jq -r '
  . as $root |
  {
    "hookSpecificOutput": {
      "additionalContext": (
        "## Plan Review Feedback\n\n" +
        "The following comments require attention on plan: **" + .planId + "**\n\n" +
        ([.sections[] | select(.comments | map(select(.resolved == false)) | length > 0) |
          "### " + .heading + " [" + .status + "]\n" +
          ([.comments[] | select(.resolved == false) |
            "- **" + .author + "** (" + (.createdAt | split("T")[0]) + "): " + .text
          ] | join("\n"))
        ] | join("\n\n")) +
        "\n\n---\nPlease address these comments in your response or update the plan accordingly."
      )
    }
  }
' "$ACTIVE_COMMENTS" 2>/dev/null)

# Only output if we got valid JSON
if [ $? -eq 0 ] && [ -n "$CONTEXT" ] && [ "$CONTEXT" != "null" ]; then
  echo "$CONTEXT"
else
  echo '{}'
fi

exit 0
