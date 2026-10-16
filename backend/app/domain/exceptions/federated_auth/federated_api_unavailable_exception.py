from app.domain.exceptions.domain_exception import DomainException


class FederatedApiUnavailableException(DomainException):
    def __init__(self, provider_label: str):
        super().__init__(
            message=f"No se pudo comunicar con {provider_label} en este momento. Intentá de nuevo en unos minutos.",
            status_code=502
        )
