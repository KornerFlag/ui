# experiment-log — Experiment Logging Skill

## When to Use
Starting any tuning run, training run, model swap, or tracker config change.
Use this before touching hyperparameters or swapping model weights.

## Steps

### 1. Create experiment folder in Obsidian
Write `korner-flag/experiments/YYYY-MM-DD-<name>/plan.md` via obsidian MCP.

Plan template:
```markdown
# Experiment: <name>
Date: YYYY-MM-DD
Branch: feat/<name>

## Hypothesis
One sentence: what we expect to improve and why.

## What Changes
- File/param: old value → new value

## Baseline Metrics (from eval/results/baseline.json)
| Metric | Baseline |
|--------|----------|
| MOTA   | ...      |
| IDF1   | ...      |
| ID switches | ... |

## Success Criteria
- MOTA improves by at least X points
- No regression in IDF1

## Rollback Plan
git revert or restore specific config values.
```

### 2. Run the experiment
Make changes, run eval harness via `cv-eval` skill.

### 3. Write results
Write `korner-flag/experiments/YYYY-MM-DD-<name>/results.md` via obsidian MCP.

Results template:
```markdown
# Results: <name>
Date: YYYY-MM-DD
Commit: <sha>

## Metrics
| Metric | Baseline | Result | Delta |
|--------|----------|--------|-------|
| MOTA   | ...      | ...    | ...   |

## Verdict
Pass / Fail — one sentence explanation.

## Decision
Merge / Abandon / Continue tuning — with reasoning.
```

### 4. If a new architectural decision was made
Write `korner-flag/decisions/DDDD-<title>.md` via obsidian MCP using ADR format.
Increment DDDD from the last decision number in the vault.
