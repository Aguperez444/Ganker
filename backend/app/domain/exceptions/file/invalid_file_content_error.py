from app.domain.exceptions.domain_exception import DomainException


class InvalidFileContentError(DomainException):
    """Lanzada cuando el contenido del archivo no coincide con su formato o contiene elementos inseguros."""

    def __init__(self, message: str = "El contenido del archivo no es válido o contiene elementos no permitidos."):
        super().__init__(
            message=message,
            status_code=400
        )
