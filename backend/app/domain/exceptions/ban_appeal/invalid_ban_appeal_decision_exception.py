from app.domain.exceptions.domain_exception import DomainException


class InvalidBanAppealDecisionException(DomainException):
    def __init__(self):
        super().__init__(
            message="Elegí aceptar o rechazar la apelación.",
            status_code=422,
        )
