from app.domain.exceptions.domain_exception import DomainException


class InvalidFileExtensionError(DomainException):
    """Lanzada cuando la extensión no está en la lista blanca."""

    def __init__(self, extension: str, allowed_extensions: list):
        allowed_extensions_str = ', '.join(allowed_extensions)
        super().__init__(
            message=f'La extensión de archivo "{extension}" no es válida. Las extensiones permitidas son: "{allowed_extensions_str}".',
            status_code=400
        )