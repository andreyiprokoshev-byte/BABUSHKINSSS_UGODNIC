"""Run the packaged game's smoke scenario in the system webview."""
import argparse
from pathlib import Path
import subprocess
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("executable", type=Path, help="native game executable")
    parser.add_argument("--timeout", type=int, default=120)
    args = parser.parse_args()

    executable = args.executable.resolve()
    if not executable.is_file():
        parser.error(f"executable not found: {executable}")

    try:
        result = subprocess.run([str(executable), "--smoke-test"], timeout=args.timeout)
    except (OSError, subprocess.TimeoutExpired) as error:
        print(f"Desktop smoke test failed: {error}", file=sys.stderr)
        return 1

    if result.returncode != 0:
        print(f"Desktop smoke test failed (exit {result.returncode})", file=sys.stderr)
        return 1
    print("Desktop smoke test passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
