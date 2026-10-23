from datetime import datetime

from app.domain.exceptions.domain_exception import DomainException


class BanNotFinishedException(DomainException):
    def __init__(self, reason: str | None = None, expires_at: datetime | None = None):
        self.reason = reason
        self.expires_at = expires_at
        message = "El baneo del jugador aún no ha finalizado"
        if reason is not None:
            message += f". Motivo: {reason}"
        if expires_at is not None:
            message += f". Vencimiento: {expires_at.isoformat()}"
        elif reason is not None:
            message += ". Sin fecha de vencimiento"
        super().__init__(message=message, status_code=400)
