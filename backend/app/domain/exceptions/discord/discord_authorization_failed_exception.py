from app.domain.exceptions.domain_exception import DomainException


class DiscordAuthorizationFailedException(DomainException):
    def __init__(self):
        super().__init__(
            message="Discord no confirmó la autorización (puede haber vencido). Volvé a intentar conectar tu cuenta.",
            status_code=400
        )
