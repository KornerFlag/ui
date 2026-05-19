#!/usr/bin/env python3
"""
Stop hook: run pytest before allowing session end.

Exits 0  → tests pass (or no tests yet), session can end.
Exits 2  → tests failed, Claude Code continues the session.
"""

import os
import subprocess
import sys

project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
tests_dir = os.path.join(project_dir, "tests")

if not os.path.isdir(tests_dir):
    sys.exit(0)  # no tests yet — no gate

result = subprocess.run(
    [sys.executable, "-m", "pytest", "tests/", "-x", "--tb=short", "-q"],
    cwd=project_dir,
)

if result.returncode != 0:
    print("Test gate: failing tests detected. Fix before ending session.")
    sys.exit(2)

sys.exit(0)
