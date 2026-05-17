# Korner Flag — CLAUDE.md

Project constitution. Loaded every session. Edit deliberately.

---

## Project Overview

Korner Flag is a soccer analytics and corner-kick prediction system. It takes match
footage, detects and tracks players and the ball, projects positions onto a real-world
pitch, and produces analytics (heatmaps, speed, possession, corner-kick outcomes).

**Stack**
- Detection: YOLOv8 (Ultralytics) fine-tuned on soccer footage
- Tracking: ByteTrack → migrating to BoT-SORT for re-identification (week 4)
- Calibration: YOLOv8 keypoint model + per-frame homography
- Analytics: numpy, supervision, scikit-learn
- Local LLM: Qwen 2.5 Coder 14B via Ollama (offload target)
- Memory: Obsidian vault via MCP (auto-updated, see below)

**Timeline:** Now → mid-August (≈ 14 weeks). Three coders.

---

## The Contract

`core/types.py` defines `TrackedObject`. This is the cross-lane contract between
detection/tracking and everything downstream. Changing it requires team agreement
documented in `docs/decisions/` AND in the Obsidian vault under
`korner-flag/decisions/`.

```python
@dataclass
class TrackedObject:
    track_id: int        # stable across occlusions (BoT-SORT ReID)
    class_id: int        # player, ball, ref, goalkeeper
    bbox: tuple          # x1, y1, x2, y2 in frame pixels
    pitch_xy: tuple      # x, y in real-world meters (homography output)
    confidence: float
    frame_idx: int
    team_id: int | None  # assigned by Lane B downstream
```

**Always use `pitch_xy` (meters) for distance, speed, and heatmaps. Never raw pixel
bbox coordinates.** This is the #1 source of "wonky speed" bugs.

---

## Korner Flag — Work Split

## Krish
- Improve tracking model
- Feature building (pipeline, stat extraction, demo video sourcing)
- LLC formation (NC Secretary of State filing)

## Achyuta
- Cold contact / outreach
- UI (investor demo priority)
- Payment setup (deferred until post-demo)

## Osman
- AI feature: formation detection
  - Consumes pipeline JSON output (player positions, team assignments)
  - Classifies team shape per frame (4-3-3, 4-4-2, etc.)
  - Formation overlay on demo video
  - Pattern/strategy recognition deferred to roadmap (post-MVP)
- Server cost analysis and infrastructure setup
  - GPU compute (Runpod L4/RTX 4090)
  - Video storage (Cloudflare R2)
  - API layer (Railway / Render / Fly.io)

## Shared / In Flight
- NC State outreach follow-up (Krish driving, Achyuta supporting)
- Pitch deck + demo video (done)

## Dependencies
- Osman blocked on stable JSON schema from Krish's pipeline — lock this first
- Achyuta's UI blocked on demo flow decisions (which video plays first, what stats display)

---

## Project Rules

- Heatmaps use Gaussian KDE with sigma=2.0 unless explicitly overridden.
- Every change touching detection or tracking must run the eval harness. Numbers go
  in the PR description AND get logged to Obsidian under
  `korner-flag/experiments/`. See the `cv-eval` skill.
- Commit per task, not per session. PR title matches the spec/task name.
- New CV dependencies require team review. Current stack: ultralytics, supervision,
  opencv-python, numpy, scikit-learn. Adding torch variants or new tracker libs needs
  justification in `docs/decisions/`.
- Pre-PR: run `cv-code-review` skill. Pre-merge: Claude reviews PR via `gh pr review`.
- Branches: `feat/`, `fix/`, `chore/`, `eval/`. Never work on `main`.

---

## Git & GitHub Workflow

- `gh` (GitHub CLI) is installed and authenticated. Use it.
- New work: `git checkout -b feat/<short-name>` before any edits.
- Open PRs with `gh pr create --title "..." --body "..."`. Body must include eval
  numbers if CV code changed.
- Review teammates' PRs: `gh pr list`, `gh pr checkout <n>`, `gh pr review`.
- One commit per task (cc-sdd `/kiro-impl` enforces this).

---

## Local Model Delegation (Qwen 2.5 Coder 14B via Ollama)

Local model runs at `http://localhost:11434`. Use it for tedious or bulk work to
preserve Claude tokens for the hard thinking. See the `local-offload` skill for
exact triggers.

Default delegation targets:
- Bulk dataset/label sanity checks before training runs
- First-pass review of large diffs (Claude does deep review after)
- Test data generation
- Obsidian note tagging (via Smart Connections plugin)
- Frame metadata extraction from match logs

Invoke: `ollama run qwen2.5-coder:14b "<prompt>"` from bash.

---

## Obsidian as Persistent Memory

Obsidian is the project's long-term memory across sessions, teammates, and time.
Claude reads from and writes to it automatically. The vault survives compactions,
new sessions, and laptop reboots — Claude does not.

### Vault structure

The Korner Flag vault subfolder is laid out as:

```
<vault>/korner-flag/
├── decisions/         # one .md per architectural decision (ADR-style)
├── experiments/       # one folder per experiment: YYYY-MM-DD-name/
├── gotchas/           # one .md per non-obvious bug discovered, with fix
├── sessions/          # auto-generated session summaries (one per day)
├── papers/            # ingested research notes (BoT-SORT, SoccerNet, etc.)
└── meetings/          # team sync notes
```

### What gets auto-written to the vault

| Trigger | Destination | Skill responsible |
|---|---|---|
| End of every Claude Code session | `sessions/YYYY-MM-DD.md` | Stop hook |
| Before context compaction | `sessions/YYYY-MM-DD-compact-N.md` | PreCompact hook |
| Eval run completes | `experiments/YYYY-MM-DD-name/results.md` | `cv-eval` skill |
| New architectural decision made | `decisions/DDDD-title.md` | `experiment-log` skill |
| Non-obvious bug + fix discovered | `gotchas/YYYY-MM-DD-title.md` | Detected by Stop hook prompt |
| New experiment started | `experiments/YYYY-MM-DD-name/plan.md` | `experiment-log` skill |

### What Claude reads from the vault at session start

Loaded automatically on every new session:
- Latest 3 entries in `sessions/` — what was worked on recently
- All of `decisions/` — current architectural state
- All of `gotchas/` — known pitfalls to avoid repeating
- The active experiment folder if one is in progress

### How it works (technical)

Two pieces wire this up:

1. **Obsidian MCP server** — gives Claude direct read/write access to vault notes,
   with full frontmatter support, search, and backlink awareness. Configured as the
   `obsidian` MCP entry below.
2. **Claude Code hooks** — automate the "no copy-paste, just save" behavior. See the
   hook section below.

Both pieces are required. The MCP alone gives manual access. The hooks make it
automatic.

### Memory rules

- Never reference memory dramatically ("I recall from our past chats"). Just use it.
- Never invent vault entries. If something isn't in the vault, say so and ask.
- When updating an existing decision, preserve the original and add a dated revision
  block, don't overwrite.
- Sensitive info (API keys, credentials) never goes in the vault. The vault is git-synced.

---

## MCP Servers

| Server | Purpose | When it loads |
|---|---|---|
| `context7` | Live, version-pinned docs for libraries | Any time we touch ultralytics, opencv, supervision, scikit-learn, numpy, or a new framework |
| `sequential-thinking` | Structured multi-step reasoning | Homography math, ID-association logic, debugging hard tracker bugs |
| `obsidian` | Read/write the Obsidian vault for persistent memory | Loaded every session — used by hooks, skills, and on direct vault references |

### Obsidian MCP setup

Using the iansinnott `obsidian-claude-code-mcp` plugin (auto-discovery via WebSocket).

**One-time setup:**

1. Install the plugin in Obsidian: open the vault, settings → Community plugins →
   Browse → search "Claude Code MCP" → install + enable.
2. Plugin runs an MCP server on `ws://localhost:22360` by default.
3. In Claude Code, run: `claude` then `/ide` and select "Obsidian" from the list.
   Auto-discovery handles the rest.
4. Test: ask Claude "list files in my korner-flag vault folder".

Alternative (no Obsidian needed running): the filesystem-based `mcp-obsidian` via
uvx. The vault is just a folder of markdown files, so filesystem MCP works directly.
Use this if Obsidian-the-app isn't always open. Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "uvx",
      "args": ["mcp-obsidian", "--vault", "C:/Users/cosmi/Obsidian/MainVault"]
    }
  }
}
```

Pick one approach. Don't run both — they'll conflict on writes.

---

## Skills Inventory

Lean stack. ~13 skills total. Resist adding more without removing one.

### Project-specific skills (`.claude/skills/`)

| Skill | Trigger |
|---|---|
| `korner-flags` | Project-wide context (legacy, keep current) |
| `planning-with-files` | When breaking work into file-level tasks |
| `cv-eval` | Any change to detection, tracking, homography, or analytics — runs eval harness, gates regressions, logs to `korner-flag/experiments/` in Obsidian |
| `cv-code-review` | Pre-PR check for tensor shapes, frame indexing, coordinate systems, device handling, tracker configs |
| `experiment-log` | Starting any tuning, training, or model swap — writes plan to `korner-flag/experiments/YYYY-MM-DD-name/plan.md` and results to `results.md` |
| `local-offload` | Decides when to delegate to Qwen 2.5 Coder 14B vs do the work in Claude |
| `vault-recall` | Loaded at session start — reads latest sessions, all decisions, all gotchas from Obsidian vault into context |

### Superpowers skills (curated subset)

Kept:
- `brainstorming` — design phase of specs
- `writing-plans` — pairs with cc-sdd specs
- `executing-plans` — same
- `test-driven-development` — required for CV regressions
- `systematic-debugging` — for tracker ID-switch hunts
- `subagent-driven-development` — parallel execution pattern (week 7+)
- `using-git-worktrees` — parallel feature work across the three lanes

Removed (do not reinstall):
- Generic `code-review` (replaced by project-specific `cv-code-review`)
- Anything else from the original 13 that doesn't appear in the keep list

### Skill commands (cc-sdd)

Installed via `npx cc-sdd@latest --claude-skills`. Provides:
- `/kiro-discovery <topic>` — one-paragraph problem statement → brief.md
- `/kiro-spec-init <name>` — scaffold a new feature spec
- `/kiro-spec-requirements <name>` — write requirements (the *what*)
- `/kiro-spec-design <name>` — architecture + file changes + dependencies (THE phase gate, push back here)
- `/kiro-spec-tasks <name>` — decompose into atomic, testable tasks
- `/kiro-impl <name>` — autonomous impl with TDD, reviewer pass, auto-debug

Use the spec loop for any change >1 file or >30 minutes of work. Skip it for one-off
scripts and quick fixes.

---

## Subagents (`.claude/agents/`)

Only two. Both run in isolated context so verbose output doesn't pollute the main session.

### `cv-researcher`

```yaml
---
name: cv-researcher
description: Reads CV papers, GitHub repos, and library docs. Extracts implementation patterns for multi-object tracking, ReID, homography, and soccer analytics. Use proactively when picking or comparing tracking approaches, ReID models, or calibration methods. Writes paper summaries to korner-flag/papers/ in Obsidian.
tools: [Read, WebFetch, Grep, Glob]
model: sonnet
---
Return concise summaries with specific implementation details Krish can apply.
No theory dumps. Cite paper or repo. Compare 2-3 alternatives when relevant.
For papers worth keeping, write a summary note to korner-flag/papers/ via the
obsidian MCP with frontmatter: title, authors, year, source_url, tags.
```

### `code-reviewer`

```yaml
---
name: code-reviewer
description: Reviews tracking and inference code for correctness, performance, and clarity. Use before opening any PR that touches CV code paths.
tools: [Read, Grep, Bash]
model: opus
---
Senior Python reviewer focused on CV pipelines. Check:
- Tensor shapes and device placement
- Off-by-one in frame indexing
- Coordinate system bugs (pixel vs pitch_xy, BGR vs RGB)
- ByteTrack/BoT-SORT config consistency
- GPU memory and batch handling
Return a numbered list of issues with file:line references and severity.
```

Removed: all GSD-prefixed subagents. Their generic descriptions overlap with the
above and add context pressure.

---

## Hooks (`.claude/settings.json`)

Four hooks active. The Stop and PreCompact hooks are what make Obsidian memory
truly automatic.

### 1. PreToolUse on Edit/Write — safety
Blocks edits to `.env`, `node_modules/`, `dist/`, `build/`, and `models/`
(trained weights, don't accidentally overwrite).

### 2. Stop hook — auto-write session summary to Obsidian

Runs when a session ends. Reads the session transcript, extracts decisions,
patterns, gotchas, and writes a structured note to
`<vault>/korner-flag/sessions/YYYY-MM-DD.md`. Also extracts any new gotchas
into `korner-flag/gotchas/`.

Script lives at `.claude/hooks/save_session.py`. It calls the Anthropic API
with the transcript and a prompt that returns YAML for:
- `summary` — 2-3 sentences
- `decisions` — list (gets appended to decisions/ if marked durable)
- `gotchas` — list (each becomes a gotchas/ file if new)
- `next_session_starts_with` — what to pick up tomorrow

Hook config:
```json
{
  "hooks": {
    "Stop": [{
      "command": "python .claude/hooks/save_session.py"
    }]
  }
}
```

### 3. PreCompact hook — checkpoint before context compaction

Same script as Stop, but runs before Claude Code compacts context. Prevents
losing decisions and gotchas when long sessions hit the context limit.

### 4. Test gate on Stop — regression prevention

Runs `pytest tests/ -x` and the eval harness on a small smoke clip before
allowing session end. Catches "shipped a regression" before the PR exists.

---

## What Was Removed and Why

For future-me when I'm tempted to re-add things:

- **GSD suite (40+ skills + agents):** Overlapped with cc-sdd and Superpowers. Three
  competing planning voices made Claude pick wrong. ~5,500+ tokens of skill metadata
  burned per session for capabilities we don't use.
- **gstack:** Designed for a solo founder running parallel sprints across many small
  features. We have three humans filling those roles. Stole the `/review` and
  `/retrospective` patterns, skipped the install.
- **Generic code-review skill:** Replaced by `cv-code-review` which knows about
  tensor/coordinate bugs.
- **HuggingFace, OpenCV, DuckDB, frontend-design skills:** Not installed yet. Add
  when the lane that needs them activates, not before.
- **claude-mem / built-in memory systems:** Obsidian vault is more durable, more
  inspectable (it's just markdown), and team-shareable via Git. Don't add a second
  memory layer.

---

## Phase Roadmap (high level)

| Phase | Weeks | Focus |
|---|---|---|
| 0 | 1 | Harness, contracts, eval baseline, Obsidian wiring |
| 1 | 2-6 | Fix accuracy: homography → ReID → heatmap rebuild |
| 2 | 7-12 | New features: team assignment, possession, corner detection, corner outcome, dashboard |
| 3 | 13-14 | Harden, document, ship |

Full plan lives in `docs/roadmap.md`. This file is the constitution; the roadmap is
the schedule. The Obsidian vault is the working memory across all of it.
