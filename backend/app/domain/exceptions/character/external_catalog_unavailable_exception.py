from app.domain.exceptions.domain_exception import DomainException


class ExternalCatalogUnavailableException(DomainException):
    """Lanzada cuando el catálogo externo de personajes no responde o devuelve datos inesperados."""

    def __init__(self, source_name: str):
        super().__init__(
            message=f"No se pudo obtener la información desde {source_name}. Intentá de nuevo más tarde.",
            status_code=502
        )
