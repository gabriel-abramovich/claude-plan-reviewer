# Claude Plan Review App

A web application for reviewing Claude Code plans with comments, approval workflows, and automatic context injection.

## Features

- **Plan Viewer**: View and navigate plans with markdown rendering
- **Section Comments**: Add feedback to specific sections of a plan
- **Approval Workflow**: Mark sections as approved/rejected/resolved
- **Live Updates**: Real-time sync when plans change
- **Claude Integration**: Unresolved comments are automatically injected into Claude's context
- **Dark/Light Theme**: Toggle with `t` key

## Quick Install

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/claude-plan-reviewer.git ~/.claude/plan-viewer-app

# Run the installer
bash ~/.claude/plan-viewer-app/install.sh
```

Or use the one-liner:
```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/claude-plan-reviewer/main/install.sh | bash
```

## Manual Setup

1. **Clone to `~/.claude/plan-viewer-app/`**
   ```bash
   git clone <repo-url> ~/.claude/plan-viewer-app
   cd ~/.claude/plan-viewer-app
   npm install
   ```

2. **Copy hooks**
   ```bash
   cp scripts/inject-plan-comments.sh ~/.claude/hooks/
   cp scripts/open-plan-viewer.sh ~/.claude/hooks/
   chmod +x ~/.claude/hooks/*.sh
   ```

3. **Update `~/.claude/settings.json`**
   ```json
   {
     "hooks": {
       "UserPromptSubmit": [
         {
           "hooks": [{
             "type": "command",
             "command": "cat | ~/.claude/hooks/inject-plan-comments.sh"
           }]
         }
       ],
       "PostToolUse": [
         {
           "matcher": "Write",
           "hooks": [{
             "type": "command",
             "command": "cat | ~/.claude/hooks/open-plan-viewer.sh"
           }]
         }
       ]
     }
   }
   ```

4. **Add to `~/.claude/CLAUDE.md`** (see install.sh for full content)

## Usage

### Start the App
```bash
cd ~/.claude/plan-viewer-app
npm run dev
```

The app runs on:
- Frontend: http://localhost:3334
- Backend: http://localhost:3335

### Automatic Opening
When Claude writes a plan to `~/.claude/plans/`, the app opens automatically in your browser.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `t` | Toggle dark/light theme |
| `Cmd+/` | Toggle sidebar |
| `j`/`k` | Navigate sections |

## How It Works

1. **Plans** are stored as markdown files in `~/.claude/plans/`
2. **Comments** are stored as JSON in `~/.claude/plan-comments/`
3. **UserPromptSubmit hook** reads unresolved comments and injects them into Claude's context
4. **PostToolUse hook** detects when Claude writes a plan and opens the app

### Comment Injection

When you have unresolved comments, Claude sees:
```
## Plan Review Feedback

The following comments require attention on plan: **my-plan**

### Implementation Steps [pending]
- **User** (2026-01-27): Please add error handling for the API calls

---
Please address these comments in your response or update the plan accordingly.
```

## Directory Structure

```
~/.claude/
├── plans/                  # Plan markdown files
├── plan-comments/          # Comment JSON files
├── plan-viewer-app/        # This application
│   ├── src/                # React frontend
│   ├── server/             # Express backend
│   └── scripts/            # Hook scripts
├── hooks/
│   ├── inject-plan-comments.sh
│   └── open-plan-viewer.sh
├── settings.json           # Claude Code settings
└── CLAUDE.md               # Global instructions
```

## Development

```bash
# Start dev server (frontend + backend)
npm run dev

# Start only frontend
npm run dev:client

# Start only backend
npm run dev:server

# Type check
npm run typecheck

# Build for production
npm run build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plans` | List all plans |
| GET | `/api/plans/:id` | Get plan content |
| GET | `/api/comments/:planId` | Get comments |
| POST | `/api/comments/:planId` | Add comment |
| PATCH | `/api/comments/:planId/:commentId` | Update comment |
| DELETE | `/api/comments/:planId/:commentId` | Delete comment |
| PATCH | `/api/sections/:planId/:sectionId/status` | Set section status |

## Troubleshooting

### App doesn't open automatically
- Check that hooks are installed: `ls -la ~/.claude/hooks/`
- Check settings.json has the hook configuration
- Check hook is executable: `chmod +x ~/.claude/hooks/*.sh`

### Comments not injecting
- Test the hook: `echo '{}' | ~/.claude/hooks/inject-plan-comments.sh`
- Check for unresolved comments in `~/.claude/plan-comments/`

### Port already in use
- Kill existing process: `pkill -f plan-viewer-app`
- Or change ports in `vite.config.ts` and `server/index.ts`
