#!/usr/bin/env python3
"""
Stop / PreCompact hook: summarize session to Obsidian vault.

Claude Code sends JSON on stdin:
  {"session_id": "...", "transcript_path": "/path/to/transcript.jsonl", "stop_hook_active": true}

Usage:
  python save_session.py           # Stop hook  → sessions/YYYY-MM-DD.md
  python save_session.py --compact # PreCompact → sessions/YYYY-MM-DD-compact-N.md
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

VAULT = Path("D:/Krish Code Vault/korner-flag")
SESSIONS_DIR = VAULT / "sessions"
GOTCHAS_DIR = VAULT / "gotchas"
PROJECT_ROOT = Path(__file__).parents[2]

PROMPT = """You are reviewing a Claude Code session transcript for the Korner Flag project (soccer analytics).
Extract the following as YAML only — no prose, no code fences:

summary: |
  2-3 sentence summary of what was accomplished this session.

decisions:
  - description: <what was decided or designed>
    durable: <true if team-wide architectural, false if local/exploratory>

gotchas:
  - title: <kebab-case-slug>
    description: <the bug or pitfall>
    fix: <how to fix or avoid it>

next_session_starts_with: |
  One paragraph: what to load from the vault, what to continue, any open issues.

Return ONLY valid YAML. If nothing meaningful happened, write a one-sentence summary and leave lists empty.

TRANSCRIPT (most recent turns):
{snippet}
"""


def read_transcript(path: str) -> str:
    p = Path(path)
    if not p.exists():
        return "[transcript file not found]"
    try:
        text = p.read_text(encoding="utf-8").strip()
        # JSONL format (one JSON object per line)
        turns = []
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            role = obj.get("role", "")
            content = obj.get("content", "")
            if isinstance(content, list):
                content = " ".join(
                    b.get("text", "") for b in content
                    if isinstance(b, dict) and b.get("type") == "text"
                )
            if role and content:
                turns.append(f"{role.upper()}: {str(content)[:400]}")
        return "\n\n".join(turns[-40:]) or "[empty transcript]"
    except Exception as e:
        return f"[could not read transcript: {e}]"


def call_api(snippet: str) -> str:
    try:
        import anthropic
        client = anthropic.Anthropic()
        resp = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            messages=[{"role": "user", "content": PROMPT.format(snippet=snippet)}],
        )
        return resp.content[0].text.strip()
    except Exception as e:
        return (
            f"summary: |\n  Session ended. API extraction failed: {e}\n"
            "decisions: []\ngotchas: []\nnext_session_starts_with: |\n"
            "  Check conversation manually for decisions made this session."
        )


def write_gotchas(yaml_text: str, today: str) -> None:
    try:
        import yaml
        parsed = yaml.safe_load(yaml_text)
        gotchas = (parsed or {}).get("gotchas") or []
        GOTCHAS_DIR.mkdir(parents=True, exist_ok=True)
        for g in gotchas:
            if not isinstance(g, dict):
                continue
            title = str(g.get("title", "untitled")).strip().lower().replace(" ", "-")
            dest = GOTCHAS_DIR / f"{today}-{title}.md"
            if dest.exists():
                continue
            dest.write_text(
                f"---\ndate: {today}\ntags: [korner-flag, gotcha]\n---\n\n"
                f"# {g.get('title', title)}\n\n"
                f"**Description:** {g.get('description', '')}\n\n"
                f"**Fix:** {g.get('fix', '')}\n",
                encoding="utf-8",
            )
    except ImportError:
        pass  # PyYAML not installed — session note already written
    except Exception:
        pass


def sync_claude_md() -> None:
    src = PROJECT_ROOT / "CLAUDE.md"
    if not src.exists():
        return
    dest = VAULT / "project-constitution.md"
    VAULT.mkdir(parents=True, exist_ok=True)
    dest.write_text(src.read_text(encoding="utf-8"), encoding="utf-8")


def main():
    is_compact = "--compact" in sys.argv

    try:
        hook_data = json.load(sys.stdin)
    except Exception:
        hook_data = {}

    transcript_path = hook_data.get("transcript_path", "")
    session_id = hook_data.get("session_id", "unknown")

    snippet = read_transcript(transcript_path) if transcript_path else "[no transcript path provided]"
    yaml_text = call_api(snippet)

    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M")
    SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

    if is_compact:
        existing = list(SESSIONS_DIR.glob(f"{today}-compact-*.md"))
        fname = f"{today}-compact-{len(existing) + 1}.md"
    else:
        fname = f"{today}.md"

    dest = SESSIONS_DIR / fname
    session_block = f"## Session {time_str} — {session_id}\n\n```yaml\n{yaml_text}\n```\n"

    if dest.exists() and dest.read_text(encoding="utf-8").strip():
        # Don't clobber a prior same-day session or any manual edits — append.
        with dest.open("a", encoding="utf-8") as f:
            f.write(f"\n---\n\n{session_block}")
    else:
        dest.write_text(
            f"---\ndate: {today}\nsession_id: {session_id}\ntags: [korner-flag, session-log]\n---\n\n"
            f"# Session log {today}\n\n{session_block}",
            encoding="utf-8",
        )

    write_gotchas(yaml_text, today)
    sync_claude_md()
    sys.exit(0)


if __name__ == "__main__":
    main()
