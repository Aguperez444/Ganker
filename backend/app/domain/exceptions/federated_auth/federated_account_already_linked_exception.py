from app.domain.exceptions.domain_exception import DomainException


class FederatedAccountAlreadyLinkedException(DomainException):
    def __init__(self, provider_label: str):
        super().__init__(
            message=f"Esa cuenta de {provider_label} ya está asociada a otro jugador de Ganker.",
            status_code=409
        )
