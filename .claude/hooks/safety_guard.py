#!/usr/bin/env python3
"""
PreToolUse hook: block writes/edits to protected paths.

Claude Code sends JSON on stdin:
  {"tool_name": "Edit", "tool_input": {"file_path": "..."}}
"""

import json
import re
import sys

BLOCKED = [
    (r"(^|[/\\])\.env($|\.)", ".env files contain secrets"),
    (r"(^|[/\\])node_modules[/\\]", "node_modules/ is managed by npm"),
    (r"(^|[/\\])dist[/\\]", "dist/ is build output"),
    (r"(^|[/\\])build[/\\]", "build/ is build output"),
    (r"(^|[/\\])models[/\\]", "models/ holds trained weights — don't overwrite"),
]


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool_input = data.get("tool_input", {})
    path = (tool_input.get("file_path") or tool_input.get("path") or "").replace("\\", "/")

    for pattern, reason in BLOCKED:
        if re.search(pattern, path, re.IGNORECASE):
            print(json.dumps({
                "decision": "block",
                "reason": f"Protected path blocked: {path}\n{reason}\nConfirm with user before editing this path."
            }))
            sys.exit(0)

    sys.exit(0)


if __name__ == "__main__":
    main()
