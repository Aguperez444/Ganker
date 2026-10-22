import os
from pathlib import Path
import shlex
import subprocess
import sys
import textwrap

import pytest


@pytest.mark.parametrize("mode,expected_success,expected_attempts", [
    ("healthy", True, 1),
    ("starting", True, 2),
    ("html", False, 30),
    ("wrong_json", False, 30),
    ("unavailable", False, 30),
    ("bad_gateway", False, 30),
    ("connection", False, 30),
])
def test_smoke_requires_healthy_api_even_when_frontend_works(tmp_path, mode, expected_success, expected_attempts):
    fake_bin = tmp_path / "bin"
    fake_bin.mkdir()
    counter = tmp_path / "api_attempts"
    fake_curl = tmp_path / "fake_curl.py"
    fake_curl.write_text(textwrap.dedent('''\
        import os
        from pathlib import Path
        import sys
        from urllib.parse import urlsplit

        args = sys.argv[1:]
        path = urlsplit(args[-1]).path
        status, content_type, body = "200", "text/html", '<html><script src="/assets/app.js"></script><link href="/assets/app.css"></html>'
        if path == "/api/v1/health":
            counter = Path(os.environ["SMOKE_API_COUNTER"])
            attempt = int(counter.read_text()) + 1 if counter.exists() else 1
            counter.write_text(str(attempt))
            mode = os.environ["SMOKE_API_MODE"]
            if mode == "connection":
                sys.exit(7)
            if mode != "html":
                content_type, body = "application/json", '{"status": "ok"}'
            if mode == "wrong_json":
                body = '{"status": "unavailable"}'
            if mode == "unavailable" or (mode == "starting" and attempt == 1):
                status, body = "503", '{"status": "unavailable"}'
            if mode == "bad_gateway":
                status, content_type, body = "502", "text/html", "Bad Gateway"
        elif path == "/.env":
            status = "404"
        elif path.endswith(".js"):
            content_type = "application/javascript"
        elif path.endswith(".css"):
            content_type = "text/css"
        elif path == "/robots.txt":
            content_type = "text/plain"
        elif path == "/sitemap.xml":
            content_type = "application/xml"
        elif path == "/og-banner.png":
            content_type = "image/png"
        if "--fail" in args and int(status) >= 400:
            sys.exit(22)
        if "--output" not in args:
            print(body, end="")
        if "--write-out" in args:
            template = args[args.index("--write-out") + 1]
            print(template.replace("%{http_code}", status).replace("%{content_type}", content_type), end="")
    '''))
    curl = fake_bin / "curl"
    curl.write_text(f"#!/bin/sh\nexec {shlex.quote(sys.executable)} {shlex.quote(str(fake_curl))} \"$@\"\n")
    curl.chmod(0o755)
    sleep = fake_bin / "sleep"
    sleep.write_text("#!/bin/sh\nexit 0\n")
    sleep.chmod(0o755)
    env = {
        **os.environ,
        "PATH": f"{fake_bin}{os.pathsep}{os.environ['PATH']}",
        "SMOKE_API_MODE": mode,
        "SMOKE_API_COUNTER": str(counter),
    }
    script = Path(__file__).resolve().parents[4] / "scripts" / "probar-stack.sh"
    result = subprocess.run(
        ["bash", str(script), "https://smoke.invalid"],
        env=env, capture_output=True, text=True, timeout=15,
    )
    assert (result.returncode == 0) is expected_success, result.stdout + result.stderr
    assert int(counter.read_text()) == expected_attempts
    if expected_success:
        assert "OK API y base de datos" in result.stdout
        assert "Smoke test completado exitosamente" in result.stdout
    else:
        assert "FALLO API" in result.stderr
        assert "Smoke test completado exitosamente" not in result.stdout
