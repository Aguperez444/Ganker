from datetime import datetime

from app.domain.exceptions.domain_exception import DomainException


class ReportCooldownException(DomainException):
    def __init__(self, retry_after: int, retry_at: datetime):
        self.retry_after = retry_after
        self.retry_at = retry_at
        super().__init__(
            message=(
                "Ya reportaste a este jugador recientemente. "
                f"Podrás volver a reportarlo a partir de {retry_at.isoformat()}."
            ),
            status_code=429,
        )
