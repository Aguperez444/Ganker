from app.domain.exceptions.domain_exception import DomainException


class AccountStatusUnavailableException(DomainException):
    def __init__(self):
        super().__init__(
            message="No se pudo verificar el estado de la cuenta. Intente nuevamente más tarde.",
            status_code=503
        )
