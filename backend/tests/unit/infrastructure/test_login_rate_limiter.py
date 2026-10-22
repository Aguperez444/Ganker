from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi import Request, FastAPI
from fastapi.testclient import TestClient
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.domain.exceptions.auth.rate_limit_exceeded_exception import RateLimitExceededException
from app.infrastructure.api.dependencies.auth_rate_limiter import AuthRateLimiter
from app.infrastructure.config.settings import settings


@pytest.mark.parametrize("peer,expected", [
    ("172.30.0.10", "198.51.100.42"),
    ("203.0.113.7", "203.0.113.7"),
])
def test_uvicorn_only_resolves_forwarded_ip_from_trusted_proxy(peer, expected):
    app = FastAPI()

    @app.get("/")
    def client_ip(request: Request):
        return {"ip": AuthRateLimiter.get_client_ip(request)}

    app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["172.30.0.10"])
    with TestClient(app, client=(peer, 50000)) as client:
        response = client.get("/", headers={
            "X-Forwarded-For": "198.51.100.99, 198.51.100.42",
            "X-Real-IP": "198.51.100.98",
            "CF-Connecting-IP": "198.51.100.97",
        })
    assert response.json() == {"ip": expected}


def test_parallel_attempts_cannot_exceed_limit(monkeypatch):
    monkeypatch.setattr(settings, "login_rate_limit_enabled", True)
    monkeypatch.setattr(settings, "login_rate_limit_max_attempts", 5)
    monkeypatch.setattr(settings, "login_rate_limit_window_seconds", 60)
    limiter = AuthRateLimiter()
    request = Request({"type": "http", "client": ("203.0.113.1", 50000)})

    def attempt(_):
        try:
            limiter.check(request)
        except RateLimitExceededException as exc:
            assert exc.status_code == 429
            return False
        return True

    with ThreadPoolExecutor(max_workers=16) as pool:
        results = list(pool.map(attempt, range(32)))
    assert sum(results) == 5


def test_limiter_allows_attempts_after_window_and_removes_expired_keys(monkeypatch):
    monkeypatch.setattr(settings, "login_rate_limit_enabled", True)
    monkeypatch.setattr(settings, "login_rate_limit_max_attempts", 1)
    monkeypatch.setattr(settings, "login_rate_limit_window_seconds", 60)
    clock = [100.0]
    monkeypatch.setattr("app.infrastructure.api.dependencies.auth_rate_limiter.time.monotonic", lambda: clock[0])
    limiter = AuthRateLimiter()
    request = Request({"type": "http", "client": ("203.0.113.1", 50000)})
    limiter.check(request, "old@example.com")
    with pytest.raises(RateLimitExceededException):
        limiter.check(request, "old@example.com")
    clock[0] += 60
    limiter.check(request, "new@example.com")
    assert "id:old@example.com" not in limiter._attempts
