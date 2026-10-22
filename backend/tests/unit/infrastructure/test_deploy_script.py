import json
import os
from pathlib import Path
import shlex
import subprocess
import sys
import textwrap

import pytest


@pytest.mark.parametrize("scenario,mode,success,force_recreates", [
    ("healthy", "--ci", True, [False]),
    ("fresh", "--ci", True, [False]),
    ("missing_alias", "--ci", True, [True]),
    ("alias_lost_during_up", "--ci", True, [False, True]),
    ("repair_fails", "--ci", False, [True]),
    ("unrelated_failure", "--ci", False, [False]),
    ("inspect_failure", "--ci", False, []),
    ("healthy", "--restart", True, [True]),
])
def test_deploy_repairs_missing_dns_aliases_without_removing_volumes(
    tmp_path, scenario, mode, success, force_recreates,
):
    repo_root = Path(__file__).resolve().parents[4]
    deploy = (repo_root / "scripts" / "deploy.sh").read_text()
    # Ejecutar el bloque remoto real contra un Docker simulado; sin SSH ni VM.
    remote_script = deploy.split("<<'REMOTE'\n", 1)[1].split("\nREMOTE\n", 1)[0]
    remote_dir = tmp_path / "remote"
    certs = remote_dir / "nginx" / "certs"
    certs.mkdir(parents=True)
    (remote_dir / ".env.prod").write_text("TEST_ONLY=true\n")
    for name in ("fullchain.pem", "privkey.pem"):
        (certs / name).write_text("test certificate")
    fake_bin = tmp_path / "bin"
    fake_bin.mkdir()
    fake_docker = tmp_path / "fake_docker.py"
    fake_docker.write_text(textwrap.dedent('''\
        import json
        import os
        from pathlib import Path
        import sys

        args = sys.argv[1:]
        with open(os.environ["DOCKER_CALLS"], "a") as log:
            log.write(json.dumps(args) + "\\n")
        scenario = os.environ["DOCKER_SCENARIO"]
        state_path = Path(os.environ["DOCKER_STATE"])
        state = json.loads(state_path.read_text()) if state_path.exists() else {"up_count": 0, "repaired": False}
        if args[0] in ("info", "image"):
            sys.exit(0)
        if args[0] == "inspect":
            if scenario == "inspect_failure":
                sys.exit(1)
            service = args[-1].removesuffix("-id")
            missing = not state["repaired"] and (
                scenario in ("missing_alias", "repair_fails")
                or (scenario == "alias_lost_during_up" and state["up_count"] > 0)
            )
            print("ganker_postgres_prod" if missing and service == "db" else service)
            sys.exit(0)
        if args[0] != "compose":
            sys.exit(2)
        command, options = args[5], args[6:]
        if command == "ps" and "--quiet" in options:
            if scenario != "fresh":
                print(options[-1] + "-id")
            sys.exit(0)
        if command == "up":
            state["up_count"] += 1
            failed = scenario in ("repair_fails", "unrelated_failure") or (
                scenario == "alias_lost_during_up" and "--force-recreate" not in options
            )
            if "--force-recreate" in options and not failed:
                state["repaired"] = True
            state_path.write_text(json.dumps(state))
            sys.exit(1 if failed else 0)
        sys.exit(0)
    '''))
    docker = fake_bin / "docker"
    docker.write_text(f"#!/bin/sh\nexec {shlex.quote(sys.executable)} {shlex.quote(str(fake_docker))} \"$@\"\n")
    docker.chmod(0o755)
    calls_path = tmp_path / "docker_calls.jsonl"
    env = {
        **os.environ,
        "PATH": f"{fake_bin}{os.pathsep}{os.environ['PATH']}",
        "DOCKER_CALLS": str(calls_path),
        "DOCKER_STATE": str(tmp_path / "docker_state.json"),
        "DOCKER_SCENARIO": scenario,
    }
    result = subprocess.run(
        ["bash", "-se", "--", str(remote_dir), mode],
        input=remote_script, capture_output=True, text=True, env=env, timeout=15,
    )
    assert (result.returncode == 0) is success, result.stdout + result.stderr
    calls = [json.loads(line) for line in calls_path.read_text().splitlines()]
    up_calls = [args for args in calls if args[0] == "compose" and args[5] == "up"]
    assert ["--force-recreate" in args for args in up_calls] == force_recreates
    build_calls = [args for args in calls if args[0] == "compose" and args[5] == "build"]
    assert bool(build_calls) is (mode != "--restart")
    if mode == "--restart":
        assert "--no-build" in up_calls[0]
    assert all("--wait" in args for args in up_calls)
    assert not any("--volumes" in args or "down" in args or "volume" in args or "network" in args for args in calls)
    if not success and up_calls:
        assert any(args[0] == "compose" and args[5] == "logs" for args in calls)
    if scenario in ("missing_alias", "alias_lost_during_up"):
        assert "perdió su alias DNS" in result.stderr
