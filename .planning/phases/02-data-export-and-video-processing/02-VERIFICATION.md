---
phase: 02-data-export-and-video-processing
verified: 2026-03-17T22:30:00Z
status: gaps_found
score: 4/5 must-haves verified
re_verification: false
gaps:
  - truth: "Annotated MP4s are uploaded to GitHub Releases and accessible via stable CDN URLs"
    status: failed
    reason: "The annotated video was saved as AVI (_temp_output.avi) because ffmpeg is not installed. An MP4 does exist (08fd33_4_annotated.mp4, 26 MB) from a prior run, but no GitHub Release has been created and the CDN URL in manifest.json is not live. The upload step was explicitly deferred."
    artifacts:
      - path: "output_videos/08fd33_4_annotated.mp4"
        issue: "File exists locally (26 MB) but has NOT been uploaded to GitHub Releases. The CDN URL https://github.com/KrishNaikGaunekar/Korner-Flags_stats/releases/download/clip-08fd33_4/08fd33_4_annotated.mp4 is not live."
      - path: "data/manifest.json"
        issue: "video_url points to a CDN URL that is not yet live. stats_url, heatmap_team1_url, heatmap_team2_url, and positions_url are all relative local paths (output_videos/...) which will not be resolvable by the Phase 3 site without further work."
    missing:
      - "Install ffmpeg, run pipeline to produce MP4 output"
      - "Run: python upload_release.py --stem 08fd33_4"
      - "Confirm release appears at https://github.com/KrishNaikGaunekar/Korner-Flags_stats/releases"
      - "Verify CDN URL is accessible in a browser"
      - "Update manifest.json non-video URLs to stable paths if needed by Phase 3 site"
human_verification:
  - test: "Confirm CDN URL is live after upload"
    expected: "Visiting https://github.com/KrishNaikGaunekar/Korner-Flags_stats/releases/download/clip-08fd33_4/08fd33_4_annotated.mp4 should trigger download or play in-browser"
    why_human: "Requires browser access and a live GitHub Release — cannot verify programmatically without gh CLI and network access"
  - test: "Verify heatmap PNG visual quality"
    expected: "Team 1 PNG shows blue density overlay on green pitch background titled 'Team 1'. Team 2 PNG shows red density overlay titled 'Team 2'. Both are visually legible."
    why_human: "Visual quality assessment cannot be determined by file size or pixel dimensions alone"
---

# Phase 2: Data Export and Video Processing — Verification Report

**Phase Goal:** All data artifacts for 2-3 NC State clips exist in stable, committed form — annotated MP4s on GitHub Releases, stats JSON and positions JSON in the repo, team heatmap PNGs generated, and manifest.json populated with real URLs
**Verified:** 2026-03-17T22:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Pipeline produces `positions.json` with per-player (x,y) at 1 Hz | VERIFIED | `output_videos/08fd33_4_positions.json` exists: 619 records, sample_rate_hz=1, seconds 0-29, both teams, correct schema (second/player_id/x/y/team) |
| 2 | mplsoccer generates legible heatmap PNGs for each team | VERIFIED | `08fd33_4_heatmap_team1.png` (303 KB) and `08fd33_4_heatmap_team2.png` (304 KB) exist. Blues/Reds on custom 23.32x68m pitch. Human-approved in Plan 04. |
| 3 | Stats JSON includes possession %, per-player max/avg speed, distance, team | VERIFIED | `08fd33_4_annotated_stats.json` has 42 players, each with team/distance_m/max_speed_kmh/avg_speed_kmh. Possession: team_1=37.9%, team_2=62.1%. |
| 4 | Annotated MP4s uploaded to GitHub Releases with stable CDN URLs | FAILED | MP4 exists locally (26 MB) but was NOT uploaded. CDN URL in manifest.json is not live. ffmpeg not installed prevented MP4 output from pipeline run; upload step explicitly deferred. |
| 5 | `manifest.json` committed with video URL, stats URL, heatmap URLs, match metadata | PARTIAL | `data/manifest.json` is committed with correct schema and a live GitHub CDN video_url format. However: (a) the video_url CDN resource is not yet live, (b) stats_url/heatmap URLs are relative local paths, not stable repo-relative or CDN URLs the Phase 3 site can consume. |

**Score:** 3 fully verified + 1 partial + 1 failed = **3/5 truths fully verified**

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `main.py` | `export_positions()` and restructured `generate_stats()` | VERIFIED | Both functions exist, are substantive, and `export_positions()` is called in `main()` at line 171 |
| `generate_heatmaps.py` | Standalone heatmap script using mplsoccer | VERIFIED | Exists, uses `pitch_type='custom'`, `pitch_length=23.32`, `pitch_width=68`, Blues/Reds colormaps, handles empty teams |
| `upload_release.py` | GitHub Releases upload helper | VERIFIED | Exists, `build_release_command()` and `get_cdn_url()` implemented, `gh release create` wired with `--clobber` flag |
| `data/manifest.json` | Clip manifest with video, stats, heatmap, positions URLs | PARTIAL | Schema correct, committed. Video URL format correct but CDN not live. Non-video URLs are local relative paths. |
| `output_videos/08fd33_4_positions.json` | 1 Hz positions data with real data | VERIFIED | 619 records, both teams, correct schema. Gitignored (output_videos/ excluded) — not committed but exists locally. |
| `output_videos/08fd33_4_annotated_stats.json` | Per-player stats JSON | VERIFIED | 42 players, correct per-player nested format. Gitignored — not committed but exists locally. |
| `output_videos/08fd33_4_heatmap_team1.png` | Team 1 heatmap PNG | VERIFIED | 303 KB, Blues on green pitch, human-approved. Gitignored — not committed but exists locally. |
| `output_videos/08fd33_4_heatmap_team2.png` | Team 2 heatmap PNG | VERIFIED | 304 KB, Reds on green pitch, human-approved. Gitignored — not committed but exists locally. |
| `tests/test_export.py` | 3 export tests | VERIFIED | Exists with test_positions_schema, test_positions_sample_rate, test_positions_skips_none — all pass |
| `tests/test_stats.py` | 2 stats tests | VERIFIED | Exists with test_stats_schema, test_stats_speed_calculation — all pass |
| `tests/test_heatmaps.py` | 3 heatmap tests | VERIFIED | Exists with test_heatmap_files_created, test_heatmap_dimensions, test_heatmap_empty_team — all pass |
| `tests/test_upload.py` | 5 upload tests | VERIFIED | All pass: command structure, CDN URL format, --title, --clobber, different stems |
| `tests/test_manifest.py` | 4 manifest tests | VERIFIED | All pass: schema, clip keys, video URL format, valid JSON |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `main.py` | `export_positions()` | Call after generate_stats at line 171 | WIRED | `positions_path = os.path.splitext(args.output)[0].replace('_annotated', '') + '_positions.json'` then `export_positions(tracks, video_info, positions_path)` |
| `main.py` | `generate_stats()` | Returns per-player nested dict | WIRED | Returns `{'video': ..., 'possession': ..., 'players': {str(pid): {'team': int, 'distance_m': float, 'max_speed_kmh': float, 'avg_speed_kmh': float}}}` |
| `generate_heatmaps.py` | `positions.json` | `data['positions']` read | WIRED | `for record in data['positions']:` — splits by team, extracts x/y |
| `generate_heatmaps.py` | `mplsoccer.Pitch` | `pitch.bin_statistic` + `pitch.heatmap` | WIRED | Full pipeline: draw pitch, bin_statistic, gaussian_filter, heatmap overlay, savefig |
| `upload_release.py` | `gh CLI` | `subprocess.run(['gh', 'release', 'create', ...])` | WIRED (script only) | Command construction verified; actual subprocess call requires gh CLI installed. Not yet executed against GitHub. |
| `data/manifest.json` | GitHub Releases CDN | `video_url` field | NOT LIVE | URL format is correct (`releases/download/clip-08fd33_4/...`), but GitHub Release has not been created — URL returns 404. |

### Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|-------------|------|-------------|--------|---------|
| DATA-01 | 02-01 | Pipeline exports positions.json with per-player (x,y) at 1 Hz | SATISFIED | `export_positions()` in main.py; 619 records produced from real pipeline run |
| DATA-02 | 02-02 | Pipeline generates team heatmap PNGs using mplsoccer | SATISFIED | `generate_heatmaps.py` produces Blues/Reds PNGs on custom pitch; human-verified |
| DATA-03 | 02-01 | Stats JSON schema has possession %, per-player speed/distance/team | SATISFIED | `generate_stats()` restructured; 42-player real output confirmed |
| DATA-04 | 02-03 | manifest.json committed with video URL, stats URL, heatmap URLs, metadata | PARTIAL | manifest.json committed with correct schema; video_url CDN not live; non-video URLs are local paths |
| HOST-01 | 02-03 | Annotated MP4 uploaded to GitHub Releases | NOT SATISFIED | upload_release.py script exists and is tested, but actual upload has not been executed. No release exists on GitHub. |
| HOST-02 | 02-03 | Video URLs in manifest.json point to stable GitHub Release CDN URLs | NOT SATISFIED | URL format in manifest.json is correct, but the release has not been created — URL is not stable/live. |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `data/manifest.json` | `stats_url`, `heatmap_team1_url`, `heatmap_team2_url`, `positions_url` are relative local paths (`output_videos/...`) | Warning | These URLs point to the gitignored `output_videos/` directory. The Phase 3 site cannot resolve them. Will need CDN or repo-relative stable paths before Phase 3 consumes this manifest. |
| `output_videos/` (entire dir) | In `.gitignore` | Info | Data artifacts (positions.json, stats.json, heatmap PNGs) exist only on the dev machine. If the machine is lost or reformatted, the data artifacts need to be regenerated. Heatmaps and stats are regenerable from pipeline; this is a known tradeoff. |

No TODO/FIXME/placeholder comments found in any source file. No stub implementations found. All test assertions are substantive.

### Human Verification Required

#### 1. GitHub Releases upload and CDN URL verification

**Test:** Install ffmpeg, run `python main.py --input <source_clip>`, then run `python upload_release.py --stem 08fd33_4`
**Expected:** A GitHub Release appears at `https://github.com/KrishNaikGaunekar/Korner-Flags_stats/releases` tagged `clip-08fd33_4`. The CDN URL `https://github.com/KrishNaikGaunekar/Korner-Flags_stats/releases/download/clip-08fd33_4/08fd33_4_annotated.mp4` resolves and is playable.
**Why human:** Requires gh CLI authenticated to the repo, network access, and browser verification of the CDN URL.

#### 2. Heatmap visual quality confirmation (already done, noted for record)

**Test:** Open `output_videos/08fd33_4_heatmap_team1.png` and `08fd33_4_heatmap_team2.png`
**Expected:** Blue density overlay on green pitch titled "Team 1"; red density overlay titled "Team 2". Both visually legible on pitch background.
**Why human:** Visual quality is subjective; file size and pixel dimensions alone cannot confirm legibility.
**Note:** User approved this in Plan 04 integration checkpoint.

### Gaps Summary

Two requirements are not satisfied at the level the phase goal specifies: **HOST-01** (actual upload to GitHub Releases) and **HOST-02** (live CDN URL in manifest.json). These share a single root cause — ffmpeg is not installed on the development machine, so the pipeline wrote a `.avi` file instead of `.mp4` during the integration run. An MP4 from a prior run does exist (`output_videos/08fd33_4_annotated.mp4`, 26 MB), so the upload could technically proceed now using that file. The upload_release.py script is fully implemented and all 5 upload tests pass — the gap is purely operational (no GitHub Release has been created).

**DATA-04** is partially satisfied: manifest.json is committed with the correct video_url CDN format, but that URL is not live, and the non-video URLs (stats, heatmaps, positions) use local relative paths that Phase 3 cannot consume without further refinement.

The code infrastructure for hosting (script, manifest schema, tests) is complete and correct. Only the execution of the upload step is missing.

---

_Verified: 2026-03-17T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
