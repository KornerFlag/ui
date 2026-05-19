#!/usr/bin/env python3
import json
import os
import sys

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

model = (data.get("model") or {}).get("display_name", "Claude")
dirname = os.path.basename((data.get("workspace") or {}).get("current_dir", os.getcwd()))
remaining = (data.get("context_window") or {}).get("remaining_percentage")

if remaining is None:
    out = f"\x1b[2m{model}\x1b[0m │ \x1b[2m{dirname}\x1b[0m"
else:
    used = max(0, min(100, round(100 - remaining)))
    filled = used // 10
    bar = "█" * filled + "░" * (10 - filled)

    if used < 50:
        color = "\x1b[32m"
    elif used < 75:
        color = "\x1b[33m"
    elif used < 90:
        color = "\x1b[38;5;208m"
    else:
        color = "\x1b[31m"

    out = f"\x1b[2m{model}\x1b[0m │ \x1b[2m{dirname}\x1b[0m │ {color}{bar} {used}%\x1b[0m"

sys.stdout.buffer.write(out.encode("utf-8"))
