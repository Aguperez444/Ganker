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
        return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer tu contraseña - Ganker</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700;800&display=swap');
    body {{
      margin: 0;
      padding: 0;
      background-color: #08061f;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #f5f3ff;
    }}
    @media only screen and (max-width: 620px) {{
      .email-container {{
        width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
      }}
      .content-padding {{
        padding: 24px 20px !important;
      }}
      .header-padding {{
        padding: 28px 20px 20px 20px !important;
      }}
      .footer-padding {{
        padding: 20px 20px !important;
      }}
      .button-cta {{
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }}
    }}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #08061f; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f3ff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #08061f; width: 100%; margin: 0; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Tarjeta Principal -->
        <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; width: 100%; background-color: #100d2b; border-radius: 16px; border: 1px solid #261c4e; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(109, 40, 217, 0.15);">
          
          <!-- Borde superior de acento con gradiente de marca -->
          <tr>
            <td style="height: 4px; background: #ff6b00; background: linear-gradient(90deg, #ff6b00 0%, #df5522 35%, #8b5cf6 70%, #6d28d9 100%);"></td>
          </tr>

          <!-- Header con Brand / Slogan -->
          <tr>
            <td class="header-padding" align="center" style="padding: 36px 36px 24px 36px; text-align: center; border-bottom: 1px solid #1c1535;">
              <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 32px; font-weight: 800; letter-spacing: 3px; line-height: 1.1; margin-bottom: 6px;">
                <span style="color: #ffffff;">GAN</span><span style="color: #ff6b00;">KER</span>
              </div>
              <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                <span style="color: #f27238;">Encuentra.</span>&nbsp;
                <span style="color: #ffffff;">Conecta.</span>&nbsp;
                <span style="color: #987bf0;">Compite.</span>
              </div>
              <div style="display: inline-block; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #ff8a3d; background-color: rgba(255, 107, 0, 0.1); border: 1px solid rgba(255, 107, 0, 0.25); border-radius: 20px; padding: 4px 12px;">
                Matchmaking por nivel real
              </div>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td class="content-padding" style="padding: 32px 36px 28px 36px;">
              <h1 style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; text-align: left;">
                Restablecer tu contraseña
              </h1>

              <p style="color: #c8c4dc; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                Hola,
              </p>
              <p style="color: #c8c4dc; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong style="color: #ffffff;">Ganker</strong>. Para continuar y definir una nueva contraseña, hacé clic en el botón a continuación:
              </p>

              <!-- Botón CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px auto; text-align: center;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #ff6b00; background: linear-gradient(90deg, #ff6b00 0%, #e0531c 45%, #8b5cf6 100%); box-shadow: 0 4px 16px rgba(255, 107, 0, 0.35);">
                    <a href="{reset_url}"
                       class="button-cta"
                       target="_blank"
                       style="display: inline-block; padding: 14px 32px; font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; border-radius: 8px;">
                      Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Aviso de seguridad y expiración -->
              <div style="background-color: #171238; border-radius: 8px; border: 1px solid #281e53; border-left: 4px solid #8b5cf6; padding: 14px 16px; margin: 24px 0 20px 0;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #b8b4c4;">
                  <strong style="color: #ffffff;">⏱ Validez:</strong> Este enlace expirará en <strong style="color: #f27238;">15 minutos</strong> y solo puede ser utilizado una vez.
                </p>
              </div>

              <!-- Enlace alternativo si el botón no funciona -->
              <p style="color: #9d97b5; font-size: 12px; line-height: 1.5; margin: 20px 0 6px 0;">
                Si el botón no funciona, copiá y pegá el siguiente enlace directamente en tu navegador:
              </p>
              <div style="background-color: #0b0820; border-radius: 6px; padding: 10px 14px; border: 1px solid #1c1535; word-break: break-all;">
                <a href="{reset_url}" style="color: #ff8a3d; font-size: 12px; text-decoration: none;">
                  {reset_url}
                </a>
              </div>

              <!-- Aviso de desestimación -->
              <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; padding-top: 16px; border-top: 1px solid #1c1535;">
                Si vos no solicitaste este cambio, podés ignorar este correo de forma segura. Tu contraseña actual seguirá protegida y no se realizará ninguna modificación en tu cuenta.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-padding" style="padding: 20px 36px 28px 36px; text-align: center; background-color: #0c0922; border-top: 1px solid #1a1438;">
              <p style="margin: 0 0 6px 0; font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #9d97b5;">
                Proyecto de estudiantes de la facultad UTN-FRC
              </p>
              <p style="margin: 0; font-size: 11px; color: #4b5563; line-height: 1.4;">
                &copy; 2026 Ganker. Todos los derechos reservados.<br>
                Este es un mensaje automático, por favor no respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

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