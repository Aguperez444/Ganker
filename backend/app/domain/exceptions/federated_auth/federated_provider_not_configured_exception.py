from app.domain.exceptions.domain_exception import DomainException


class FederatedProviderNotConfiguredException(DomainException):
    def __init__(self, provider_label: str):
        super().__init__(
            message=f"El inicio de sesión con {provider_label} no está disponible en este momento (falta configurar las credenciales del servidor).",
            status_code=503
        )
