from exceptions.domain_exception import DomainException


class StorageSecurityError(DomainException):
    """Lanzada cuando se intenta acceder o alterar archivos fuera del directorio permitido."""

    def __init__(self, message: str = "Intento de acceso no autorizado a archivos fuera del directorio permitido."):
        super().__init__(message=message,status_code=403)