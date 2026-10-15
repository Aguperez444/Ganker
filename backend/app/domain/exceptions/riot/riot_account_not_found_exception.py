from typing import Optional

from app.domain.exceptions.domain_exception import DomainException


class RiotAccountNotFoundException(DomainException):
    def __init__(self, riot_id: str, server_name: Optional[str] = None):
        where = f" en el servidor {server_name}" if server_name else ""
        super().__init__(
            message=f"No se encontró la cuenta de Riot '{riot_id}'{where}.",
            status_code=404
        )
