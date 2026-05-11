# Claude Code Setup — Skills & MCPs

## MCP Servers

| Server | Tools | Purpose |
|--------|-------|---------|
| **context7** | `resolve-library-id`, `query-docs` | Fetch current library/framework documentation on demand |

---

## Skills

### Superpowers (Workflow Discipline)

| Skill | Trigger |
|-------|---------|
| `superpowers:brainstorming` | Before any creative/build work |
| `superpowers:writing-plans` | Before multi-step implementation |
| `superpowers:executing-plans` | When running a written plan |
| `superpowers:test-driven-development` | TDD workflow — before writing implementation |
| `superpowers:systematic-debugging` | Any bug, test failure, or unexpected behavior |
| `superpowers:requesting-code-review` | After completing tasks or major features |
| `superpowers:receiving-code-review` | When acting on review feedback |
| `superpowers:verification-before-completion` | Before claiming work is done |
| `superpowers:dispatching-parallel-agents` | 2+ independent tasks that can run in parallel |
| `superpowers:subagent-driven-development` | Executing plans with independent tasks via agents |
| `superpowers:finishing-a-development-branch` | End-of-branch: tests pass, ready to merge |
| `superpowers:using-git-worktrees` | Isolated feature work |
| `superpowers:writing-skills` | Creating or editing skills |

### Project-Specific

| Skill | Purpose |
|-------|---------|
| `korner-flags` | Project knowledge for this repo |
| `planning-with-files` | Persistent markdown planning |

### Utility

| Skill | Purpose |
|-------|---------|
| `simplify` | Review and clean up recently changed code |
| `loop` | Set up recurring interval tasks (e.g. `/loop 5m /foo`) |
| `claude-api` | Build apps with Anthropic SDK / Claude API |
| `github-actions-deploy` | GitHub Pages deployments and Actions workflows |
| `keybindings-help` | Customize `~/.claude/keybindings.json` |

### GSD — Get Shit Done (Full Planning & Execution Suite)

| Category | Skills |
|----------|--------|
| **Project init** | `gsd:new-project`, `gsd:new-milestone`, `gsd:new-workspace` |
| **Phase lifecycle** | `gsd:discuss-phase`, `gsd:plan-phase`, `gsd:execute-phase`, `gsd:verify-work`, `gsd:validate-phase` |
| **Navigation** | `gsd:progress`, `gsd:next`, `gsd:do`, `gsd:check-todos`, `gsd:fast`, `gsd:quick` |
| **Planning** | `gsd:add-phase`, `gsd:insert-phase`, `gsd:remove-phase`, `gsd:research-phase`, `gsd:spec-phase` |
| **Code quality** | `gsd:code-review`, `gsd:code-review-fix`, `gsd:simplify`, `gsd:secure-phase` |
| **Debugging** | `gsd:debug` |
| **UI/AI** | `gsd:ui-phase`, `gsd:ui-review`, `gsd:ai-integration-phase`, `gsd:eval-review` |
| **Docs** | `gsd:docs-update`, `gsd:milestone-summary`, `gsd:session-report` |
| **Auditing** | `gsd:audit-milestone`, `gsd:audit-uat`, `gsd:audit-fix` |
| **Codebase analysis** | `gsd:map-codebase`, `gsd:scan`, `gsd:intel`, `gsd:graphify` |
| **Workflow** | `gsd:resume-work`, `gsd:pause-work`, `gsd:autonomous`, `gsd:ship`, `gsd:pr-branch` |
| **Ideas/notes** | `gsd:note`, `gsd:add-todo`, `gsd:add-backlog`, `gsd:review-backlog`, `gsd:plant-seed`, `gsd:explore`, `gsd:spike` |
| **Settings** | `gsd:settings`, `gsd:set-profile`, `gsd:update`, `gsd:health`, `gsd:help` |

Run `/gsd:help` for full GSD usage guide.
