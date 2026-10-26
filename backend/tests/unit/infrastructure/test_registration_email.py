from unittest.mock import AsyncMock, patch

import anyio
import httpx

from app.infrastructure.email.email_templates import build_account_email_template
from app.infrastructure.email.resend_email_service import ResendEmailService


def test_registration_email_uses_confirmation_link_and_shared_brand_template():
    service = ResendEmailService(api_key="test-key", sender_email="test@example.com", frontend_url="https://ganker.example/", api_url="https://email.example/send")
    with patch("app.infrastructure.email.resend_email_service.httpx.AsyncClient") as client_class:
        post = AsyncMock(return_value=httpx.Response(200))
        client_class.return_value.__aenter__.return_value.post = post
        anyio.run(service.send_registration_confirmation_email, "juan@example.com", "raw-token", "juancito123")

    payload = post.await_args.kwargs["json"]
    assert payload["to"] == ["juan@example.com"]
    assert payload["subject"] == "Confirmá tu cuenta - Ganker"
    assert 'href="https://ganker.example/confirm-registration?token=raw-token"' in payload["html"]
    assert "juancito123" in payload["html"]
    assert "24 horas" in payload["html"]
    assert "Confirmar mi cuenta" in payload["html"]
    assert "Restablecer" not in payload["html"]


def test_password_recovery_email_keeps_its_link_and_expiration():
    service = ResendEmailService(api_key="test-key", sender_email="test@example.com", frontend_url="https://ganker.example", api_url="https://email.example/send")
    with patch("app.infrastructure.email.resend_email_service.httpx.AsyncClient") as client_class:
        post = AsyncMock(return_value=httpx.Response(200))
        client_class.return_value.__aenter__.return_value.post = post
        anyio.run(service.send_password_reset_email, "juan@example.com", "reset-token")

    payload = post.await_args.kwargs["json"]
    assert "Recuperar acceso" in payload["subject"]
    assert "/reset-password?token=reset-token" in payload["html"]
    assert "15 minutos" in payload["html"]
    assert "Confirmar mi cuenta" not in payload["html"]


def test_email_escapes_username_and_url():
    html = build_account_email_template('https://example.com/?token=a&extra="b"', '<img src=x onerror="alert(1)">')
    assert "<img" not in html
    assert "&lt;img" in html
    assert "&amp;extra=&quot;b&quot;" in html
