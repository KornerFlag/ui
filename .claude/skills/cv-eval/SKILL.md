# cv-eval — Eval Harness Skill

## When to Use
Any change touching detection, tracking, homography, or analytics pipelines.
Run before opening a PR. Results gate regressions.

## What It Does
1. Run the eval harness on the smoke clip
2. Compare metrics to the last baseline
3. Block if any metric regresses beyond threshold
4. Log results to Obsidian under `korner-flag/experiments/`

## Steps

### 1. Run eval harness
```bash
python eval/run_eval.py --clip eval/smoke_clip.mp4 --output eval/results/latest.json
```

### 2. Compare to baseline
```bash
python eval/compare.py eval/results/baseline.json eval/results/latest.json
```

### 3. Check thresholds
- MOTA must not drop more than 2 points
- ID switches must not increase more than 10%
- Homography reprojection error must not increase more than 0.1m

### 4. Log to Obsidian
Write results to `korner-flag/experiments/YYYY-MM-DD-<branch-name>/results.md` via the obsidian MCP.

Include:
- Branch name and commit SHA
- Metric table (MOTA, IDF1, ID switches, reprojection error)
- Delta from baseline (+ or -)
- Pass/fail verdict

### 5. Put numbers in PR description
If CV code changed, eval numbers are required in the PR body. No numbers = PR is not ready.

## Regression Policy
- **Pass:** All metrics within threshold → proceed to PR
- **Fail:** Any metric outside threshold → fix before PR, do not merge

## Baseline Update
Only update baseline after a PR merges to main:
```bash
cp eval/results/latest.json eval/results/baseline.json
git add eval/results/baseline.json
git commit -m "chore: update eval baseline after <feature>"
```
