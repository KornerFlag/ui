# vault-recall — Session Start Vault Reader

## When to Use
At the start of every session. Loads persistent memory from the Obsidian vault
into context so decisions, gotchas, and recent work are available immediately.

## What to Load (in order)

### 1. Recent sessions (last 3)
Read `korner-flag/sessions/` — list files, take the 3 most recent by date.
Summarize what was worked on, what was decided, and what to pick up next.

### 2. All decisions
Read all files in `korner-flag/decisions/`.
These are durable architectural decisions. Know them before touching any code.

### 3. All gotchas
Read all files in `korner-flag/gotchas/`.
These are confirmed bugs with fixes. Do not repeat them.

### 4. Active experiment (if any)
Check `korner-flag/experiments/` for any folder without a `results.md`.
If found, load its `plan.md` — an experiment is in progress.

## How to Load
Use the obsidian MCP to read each file. Do not invent content if a file
is missing — report what's absent and ask.

## Output Format
After loading, give a brief summary:
```
Session context loaded:
- Last worked on: <topic from latest session>
- Active decisions: <count> (key ones: ...)
- Known gotchas: <count> (most relevant: ...)
- Active experiment: <name> or none
```

## Rules
- Never reference memory dramatically ("I recall from our past chats"). Just use it.
- Never invent vault entries. If something isn't in the vault, say so.
- When updating an existing decision, preserve the original and add a dated revision block.
- Sensitive info (API keys, credentials) never goes in the vault.
