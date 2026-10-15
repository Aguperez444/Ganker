import logging

import httpx

from app.application.ports.i_email_service import IEmailService
from app.infrastructure.config.settings import settings

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

    @staticmethod
    def _build_html_template(reset_url: str) -> str:
        return f"""
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px;">
                  <div style="max-width: 560px; margin: 0 auto; background-color: #1e293b; border-radius: 8px; padding: 32px; border: 1px solid #334155;">
                    <h1 style="color: #38bdf8; font-size: 24px; margin-top: 0;">Ganker</h1>
                    <h2 style="font-size: 18px; color: #f8fafc; margin-bottom: 16px;">Restablecer tu contraseña</h2>
                    <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta en Ganker.
                    </p>
                    <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">
                      Hacé clic en el botón a continuación para ingresar una nueva. Este enlace tiene una validez de <strong>15 minutos</strong>.
                    </p>
                    <div style="margin: 32px 0;">
                      <a href="{reset_url}" 
                         style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; display: inline-block;">
                        Cambiar Contraseña
                      </a>
                    </div>
                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.4; border-top: 1px solid #334155; padding-top: 16px;">
                      Si vos no solicitaste este cambio, podés ignorar este correo; tu contraseña actual continuará siendo segura.
                    </p>
                  </div>
                </body>
                </html>
                """

    async def send_password_reset_email(self, to_email: str, raw_token: str) -> None:
        reset_url = f"{self.frontend_url}/reset-password?token={raw_token}"

        payload = {
            "from": self.sender_email,
            "to": [to_email],
            "subject": "Recuperar acceso a tu cuenta - Ganker",
            "html": self._build_html_template(reset_url),
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(self.api_url, json=payload, headers=headers)

                if response.status_code >= 400:
                    logger.error(
                        "Error al despachar email de recuperación a %s. Status: %s, Body: %s",
                        to_email,
                        response.status_code,
                        response.text,
                    )
                else:
                    logger.info("Email de recuperación enviado exitosamente a %s", to_email)

        except httpx.RequestError as exc:
            logger.error("Fallo de red al conectar con el proveedor de emails: %s", exc)