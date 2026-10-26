from unittest.mock import AsyncMock, patch

import anyio
import httpx

from app.infrastructure.email.resend_email_service import ResendEmailService
from app.infrastructure.email.smtp_email_service import SMTPEmailService


def test_resend_email_change_links_to_confirmation_page():
    service = ResendEmailService(
        api_key="test-key", sender_email="test@example.com",
        frontend_url="https://ganker.example/", api_url="https://email.example/send",
    )
    with patch("app.infrastructure.email.resend_email_service.httpx.AsyncClient") as client_class:
        post = AsyncMock(return_value=httpx.Response(200))
        client_class.return_value.__aenter__.return_value.post = post
        anyio.run(service.send_email_change_confirmation_email, "new@example.com", "email-token")

    payload = post.await_args.kwargs["json"]
    assert payload["to"] == ["new@example.com"]
    assert payload["subject"] == "Confirmá tu nuevo email - Ganker"
    assert 'href="https://ganker.example/confirm-email-change?token=email-token"' in payload["html"]
    assert "Confirmar nuevo email" in payload["html"]
    assert "24 horas" in payload["html"]
    assert "Restablecer" not in payload["html"]


def test_smtp_email_change_links_to_confirmation_page():
    service = SMTPEmailService(
        host="smtp.example.com", port=587, username="test", password="test",
        sender_email="test@example.com", frontend_url="https://ganker.example/",
    )
    with patch("app.infrastructure.email.smtp_email_service.smtplib.SMTP") as smtp_class:
        anyio.run(service.send_email_change_confirmation_email, "new@example.com", "email-token")

    message = smtp_class.return_value.__enter__.return_value.send_message.call_args.args[0]
    assert message["To"] == "new@example.com"
    assert message["Subject"] == "Confirmá tu nuevo email - Ganker"
    assert "/confirm-email-change?token=email-token" in message.get_body(preferencelist=("html",)).get_content()
