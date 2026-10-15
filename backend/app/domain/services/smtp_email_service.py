import logging
import smtplib
import anyio
from email.message import EmailMessage

from app.application.ports.i_email_service import IEmailService
from app.infrastructure.config.settings import settings

logger = logging.getLogger(__name__)

class SMTPEmailService(IEmailService):

    def __init__(self,
                 host: str = getattr(settings,"smtp_host"),
                 port: int = getattr(settings,"smtp_port"),
                 username: str = getattr(settings,"smtp_username"),
                 password: str = getattr(settings,"smtp_password"),
                 sender_email: str = getattr(settings,"smtp_email_from"),
                 frontend_url: str = getattr(settings,"frontend_url")) -> None:
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.sender_email = sender_email
        self.frontend_url = frontend_url

    @staticmethod
    def _build_html_template(reset_url: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #1e293b; border-radius: 8px; padding: 32px; border: 1px solid #334155;">
            <h1 style="color: #38bdf8; font-size: 24px; margin-top: 0;">Ganker</h1>
            <h2 style="font-size: 18px; color: #f8fafc; margin-bottom: 16px;">Restablecer tu contraseña</h2>
            <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en Ganker.
            </p>
            <div style="margin: 32px 0;">
              <a href="{reset_url}" 
                 style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; display: inline-block;">
                Cambiar Contraseña
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px;">Si no solicitaste este cambio, ignorá este mensaje.</p>
          </div>
        </body>
        </html>
        """

    def _send_sync(self, to_email: str, raw_token: str) -> None:
        reset_url = f"{self.frontend_url}/reset-password?token={raw_token}"

        message = EmailMessage()
        message["Subject"] = "Recuperar acceso a tu cuenta - Ganker"
        message["From"] = self.sender_email
        message["To"] = to_email

        html_content = self._build_html_template(reset_url)
        message.set_content("Por favor, habilita HTML para ver este correo.")
        message.add_alternative(html_content, subtype="html")

        try:
            # Conexión SMTP segura con STARTTLS
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(message)
            logger.info("Email SMTP enviado exitosamente a %s", to_email)
        except Exception as exc:
            logger.error("Error al enviar email por SMTP a %s: %s", to_email, exc)
            raise


    async def send_password_reset_email(self, to_email: str, raw_token: str) -> None:
        await anyio.to_thread.run_sync(self._send_sync, to_email, raw_token)