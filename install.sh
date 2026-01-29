#!/bin/bash
# Plan Review App Installer
# Usage: curl -fsSL <raw-github-url>/install.sh | bash

set -e

CLAUDE_DIR="$HOME/.claude"
APP_DIR="$CLAUDE_DIR/plan-viewer-app"
HOOKS_DIR="$CLAUDE_DIR/hooks"
PLANS_DIR="$CLAUDE_DIR/plans"
COMMENTS_DIR="$CLAUDE_DIR/plan-comments"

echo "🚀 Installing Plan Review App..."

# Create directories
mkdir -p "$HOOKS_DIR" "$PLANS_DIR" "$COMMENTS_DIR"

# Check if app already exists
if [ -d "$APP_DIR" ]; then
  echo "📦 Updating existing installation..."
  cd "$APP_DIR"
  git pull origin main 2>/dev/null || true
else
  echo "📥 Cloning repository..."
  git clone https://github.com/gabriel-abramovich/claude-plan-reviewer.git "$APP_DIR"
  cd "$APP_DIR"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy hooks
echo "🔗 Installing hooks..."
cp "$APP_DIR/scripts/inject-plan-comments.sh" "$HOOKS_DIR/"
cp "$APP_DIR/scripts/open-plan-viewer.sh" "$HOOKS_DIR/"
chmod +x "$HOOKS_DIR/inject-plan-comments.sh"
chmod +x "$HOOKS_DIR/open-plan-viewer.sh"

# Update CLAUDE.md
echo "📝 Updating CLAUDE.md..."
CLAUDE_MD="$CLAUDE_DIR/CLAUDE.md"

# Check if plan review section already exists
if ! grep -q "Plan Review System" "$CLAUDE_MD" 2>/dev/null; then
  cat >> "$CLAUDE_MD" << 'CLAUDEMD'

# Plan Review System

This document describes the plan review system integrated with Claude Code.

## Overview

Plans are stored in `~/.claude/plans/` as markdown files. A companion review app tracks comments and approval status for each section. When you work on plans, be aware of any review feedback that may be injected into your context.

## How It Works

1. **Plans**: When Claude writes a plan to `~/.claude/plans/`, the plan review app opens automatically
2. **Comments**: Users can add comments to individual sections of the plan
3. **Status**: Each section can be marked as: pending, approved, rejected, or resolved
4. **Feedback Injection**: Unresolved comments are injected into Claude's context via UserPromptSubmit hook

## Reading Review Feedback

When there are unresolved comments on a plan, they appear in your context as:

```
## Plan Review Feedback

The following comments require attention on plan: **plan-name**

### Section Name [status]
- **User** (date): Comment text here

---
Please address these comments in your response or update the plan accordingly.
```

## Responding to Comments

When you see plan review feedback:

1. **Acknowledge**: Reference the specific comments you're addressing
2. **Update**: If the comment requires plan changes, update the plan file
3. **Explain**: If you disagree or need clarification, explain your reasoning
4. **Don't repeat**: You don't need to quote the entire comment back

## Section Statuses

- **pending**: Section not yet reviewed (default)
- **approved**: Section accepted by reviewer - no changes needed
- **rejected**: Section needs changes - pay attention to associated comments
- **resolved**: All feedback addressed, section complete

## Best Practices for Plans

When writing plans that will be reviewed:

1. **Use clear headings**: Structure with h1, h2, h3 hierarchy for easy section navigation
2. **Make sections reviewable**: Each major section should be independently assessable
3. **Include verification steps**: Add a section on how to verify the implementation
4. **Be specific**: Include file paths, function names, and concrete implementation details

## Files and Locations

- Plans: `~/.claude/plans/*.md`
- Comments: `~/.claude/plan-comments/*.json`
- Review App: `~/.claude/plan-viewer-app/`
- Hooks: `~/.claude/hooks/inject-plan-comments.sh`, `~/.claude/hooks/open-plan-viewer.sh`
CLAUDEMD
  echo "  Added Plan Review System section to CLAUDE.md"
else
  echo "  Plan Review System section already exists in CLAUDE.md"
fi

# Update settings.json
echo "⚙️  Configuring hooks in settings.json..."
SETTINGS_FILE="$CLAUDE_DIR/settings.json"

if [ ! -f "$SETTINGS_FILE" ]; then
  echo '{}' > "$SETTINGS_FILE"
fi

# Use node to safely merge settings
node << 'NODEJS'
const fs = require('fs');
const path = require('path');
const settingsPath = path.join(process.env.HOME, '.claude', 'settings.json');

let settings = {};
try {
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
} catch (e) {
  settings = {};
}

// Ensure hooks structure exists
settings.hooks = settings.hooks || {};
settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit || [];
settings.hooks.PostToolUse = settings.hooks.PostToolUse || [];

// Check if inject hook already exists
const injectHookExists = settings.hooks.UserPromptSubmit.some(h =>
  h.hooks?.some(hh => hh.command?.includes('inject-plan-comments.sh'))
);

if (!injectHookExists) {
  settings.hooks.UserPromptSubmit.push({
    hooks: [{
      type: 'command',
      command: 'cat | ' + process.env.HOME + '/.claude/hooks/inject-plan-comments.sh'
    }]
  });
  console.log('  Added UserPromptSubmit hook for comment injection');
}

// Check if viewer hook already exists
const viewerHookExists = settings.hooks.PostToolUse.some(h =>
  h.hooks?.some(hh => hh.command?.includes('open-plan-viewer.sh'))
);

if (!viewerHookExists) {
  // Find existing Write matcher or create new one
  let writeHook = settings.hooks.PostToolUse.find(h => h.matcher === 'Write');
  if (!writeHook) {
    writeHook = { matcher: 'Write', hooks: [] };
    settings.hooks.PostToolUse.unshift(writeHook);
  }

  const hasViewerHook = writeHook.hooks.some(h => h.command?.includes('open-plan-viewer.sh'));
  if (!hasViewerHook) {
    writeHook.hooks.push({
      type: 'command',
      command: 'cat | ' + process.env.HOME + '/.claude/hooks/open-plan-viewer.sh'
    });
    console.log('  Added PostToolUse hook for plan viewer');
  }
}

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
NODEJS

echo ""
echo "✅ Installation complete!"
echo ""
echo "To start the Plan Review App:"
echo "  cd ~/.claude/plan-viewer-app && npm run dev"
echo ""
echo "The app will also auto-open when Claude writes a plan to ~/.claude/plans/"
echo ""
