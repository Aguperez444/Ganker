import logging
import smtplib
import anyio
from email.message import EmailMessage

from app.application.ports.i_email_service import IEmailService
from app.infrastructure.config.settings import settings
from app.infrastructure.email.email_templates import build_account_email_template

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

    _build_html_template = staticmethod(build_account_email_template)

    def _send_sync(self, to_email: str, raw_token: str, username: str | None = None) -> None:
        path = "confirm-registration" if username is not None else "reset-password"
        reset_url = f"{self.frontend_url.rstrip('/')}/{path}?token={raw_token}"

        message = EmailMessage()
        message["Subject"] = "Confirmá tu cuenta - Ganker" if username is not None else "Recuperar acceso a tu cuenta - Ganker"
        message["From"] = self.sender_email
        message["To"] = to_email

        html_content = build_account_email_template(reset_url, registration_username=username)
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

    async def send_registration_confirmation_email(self, to_email: str, raw_token: str, username: str) -> None:
        await anyio.to_thread.run_sync(self._send_sync, to_email, raw_token, username)
