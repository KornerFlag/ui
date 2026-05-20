#!/usr/bin/env python3
"""
Stop hook: run pytest before allowing session end.

Exits 0  → tests pass (or no tests yet), session can end.
Exits 2  → tests failed, Claude Code continues the session.
"""

import json
import os
import subprocess
import sys

try:
    hook_input = json.load(sys.stdin)
except Exception:
    hook_input = {}

if hook_input.get("stop_hook_active"):
    sys.exit(0)

project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
tests_dir = os.path.join(project_dir, "tests")

if not os.path.isdir(tests_dir):
    sys.exit(0)

probe = subprocess.run(
    [sys.executable, "-c", "import pytest"],
    capture_output=True,
)
if probe.returncode != 0:
    sys.exit(0)

result = subprocess.run(
    [sys.executable, "-m", "pytest", "tests/", "-x", "--tb=short", "-q"],
    cwd=project_dir,
)

if result.returncode != 0:
    print("Test gate: failing tests detected. Fix before ending session.")
    sys.exit(2)

sys.exit(0)
