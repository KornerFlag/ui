# local-offload — Qwen 2.5 Coder 14B Delegation Skill

## Purpose
Preserve Claude tokens for hard thinking. Delegate tedious or bulk work
to Qwen 2.5 Coder 14B running locally via Ollama at http://localhost:11434.

## Delegate to Qwen When

| Task | Why |
|------|-----|
| Bulk dataset / label sanity checks before training | Repetitive, low reasoning demand |
| First-pass review of large diffs (>300 lines) | Claude does deep review after |
| Test data generation | Mechanical, template-driven |
| Frame metadata extraction from match logs | Parsing, not reasoning |
| Obsidian note tagging (Smart Connections) | Simple classification |

## Keep in Claude When

| Task | Why |
|------|-----|
| Homography math or ID-association logic | Requires deep reasoning |
| Debugging hard tracker bugs | Needs full context + reasoning |
| Architectural decisions | High-stakes, needs judgment |
| Writing specs or plans | Requires understanding of full project |
| Any task touching `TrackedObject` contract | Cross-lane impact |

## How to Invoke

```bash
ollama run qwen2.5-coder:14b "<prompt>"
```

For multi-line prompts:
```bash
ollama run qwen2.5-coder:14b "$(cat <<'EOF'
Review this diff for obvious bugs only. Return a numbered list.
Do not suggest refactors or style changes.

<paste diff here>
EOF
)"
```

## Rules
- Always tell Qwen the exact output format you need
- Never use Qwen for final decisions — Claude reviews its output
- If Qwen output looks wrong, don't retry — escalate to Claude
- Qwen has no project context — provide all relevant snippets inline
