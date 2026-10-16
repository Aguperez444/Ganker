from app.domain.exceptions.domain_exception import DomainException


class UnsupportedFederatedProviderException(DomainException):
    def __init__(self, provider: str):
        super().__init__(
            message=f"El proveedor de autenticación '{provider}' no está soportado.",
            status_code=400
        )
