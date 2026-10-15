from app.domain.exceptions.domain_exception import DomainException


class RiotApiUnavailableException(DomainException):
    """Lanzada cuando la API de Riot no responde, rechaza la clave o limita las consultas."""

    def __init__(self, message: str = "No se pudo obtener la información desde la API de Riot. Intentá de nuevo más tarde.",
                 status_code: int = 502):
        super().__init__(message=message, status_code=status_code)
