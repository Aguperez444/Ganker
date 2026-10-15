from app.domain.exceptions.domain_exception import DomainException


class NotFoundOrIsUsedResetTokenException(DomainException):
    def __init__(self):
        super().__init__(
            message="El enlace de recuperación es inválido o ya fue utilizado.",
            status_code=400
        )