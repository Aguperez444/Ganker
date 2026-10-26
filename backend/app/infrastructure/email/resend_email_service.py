import logging

import httpx

from app.application.ports.i_email_service import IEmailService
from app.infrastructure.config.settings import settings
from app.infrastructure.email.email_templates import build_account_email_template

logger = logging.getLogger(__name__)

class ResendEmailService(IEmailService):

    def __init__(self, api_key: str = getattr(settings, "resend_api_key"),
                 sender_email: str = getattr(settings, "email_from"),
                 frontend_url: str = getattr(settings, "frontend_url"),
                 api_url: str = getattr(settings, "email_api_url")) -> None:
        self.api_key = api_key
        self.sender_email = sender_email
        self.frontend_url = frontend_url.strip("/")
        self.api_url = api_url

    _build_html_template = staticmethod(build_account_email_template)

    async def send_email_change_confirmation_email(self, to_email: str, raw_token: str) -> None:
        confirmation_url = f"{self.frontend_url}/confirm-email-change?token={raw_token}"
        await self._send_email(
            to_email, "Confirmá tu nuevo email - Ganker",
            build_account_email_template(confirmation_url, email_change=True),
        )

    async def send_password_reset_email(self, to_email: str, raw_token: str) -> None:
        reset_url = f"{self.frontend_url}/reset-password?token={raw_token}"

        await self._send_email(to_email, "Recuperar acceso a tu cuenta - Ganker", self._build_html_template(reset_url))

    async def send_registration_confirmation_email(self, to_email: str, raw_token: str, username: str) -> None:
        confirmation_url = f"{self.frontend_url}/confirm-registration?token={raw_token}"
        await self._send_email(
            to_email, "Confirmá tu cuenta - Ganker",
            build_account_email_template(confirmation_url, registration_username=username),
        )

    async def _send_email(self, to_email: str, subject: str, html: str) -> None:
        payload = {"from": self.sender_email, "to": [to_email], "subject": subject, "html": html}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(self.api_url, json=payload, headers=headers)

                if response.status_code >= 400:
                    logger.error(
                        "Error al despachar email a %s. Status: %s",
                        to_email,
                        response.status_code,
                    )
                else:
                    logger.info("Email enviado exitosamente a %s", to_email)

        except httpx.RequestError as exc:
            logger.error("Fallo de red al conectar con el proveedor de emails: %s", exc)
