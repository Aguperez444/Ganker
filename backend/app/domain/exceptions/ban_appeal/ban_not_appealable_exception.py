from app.domain.exceptions.domain_exception import DomainException


class BanNotAppealableException(DomainException):
    def __init__(self):
        super().__init__(
            message="Este baneo ya no está vigente. Volvé a iniciar sesión.",
            status_code=409,
        )
