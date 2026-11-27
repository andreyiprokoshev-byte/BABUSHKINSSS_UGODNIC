#!/usr/bin/env python3
"""Smoke test for the compiled Tauri desktop binary and bundled web UI."""

from __future__ import annotations

import functools
import http.server
import os
import pathlib
import socketserver
import subprocess
import sys
import threading

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
BINARY = ROOT / "src-tauri" / "target" / "release" / (
    "pirozhkovy-dvor.exe" if sys.platform == "win32" else "pirozhkovy-dvor"
)


def main() -> int:
    if not DIST.is_dir():
        raise FileNotFoundError(f"Missing dist directory: {DIST}")

    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DIST))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
        port = httpd.server_address[1]
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        try:
            subprocess.run(
                ["node", str(ROOT / "scripts" / "desktop_smoke.js"), f"http://127.0.0.1:{port}/"],
                cwd=ROOT,
                check=True,
            )
        finally:
            httpd.shutdown()

    if not BINARY.is_file():
        raise FileNotFoundError(f"Missing desktop binary: {BINARY}")

    proc = subprocess.Popen(
        [str(BINARY), "--smoke-test"],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=os.environ.copy(),
    )
    try:
        stdout, stderr = proc.communicate(timeout=4)
        raise RuntimeError(
            f"Desktop binary exited unexpectedly with {proc.returncode}\n"
            f"stdout: {stdout.decode(errors='replace')}\n"
            f"stderr: {stderr.decode(errors='replace')}"
        )
    except subprocess.TimeoutExpired:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()

    print("Desktop binary smoke test passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
