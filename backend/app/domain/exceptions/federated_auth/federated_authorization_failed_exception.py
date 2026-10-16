from app.domain.exceptions.domain_exception import DomainException


class FederatedAuthorizationFailedException(DomainException):
    def __init__(self, provider_label: str):
        super().__init__(
            message=f"{provider_label} no confirmó la autorización (puede haber vencido). Volvé a intentarlo.",
            status_code=400
        )
