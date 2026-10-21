from app.domain.exceptions.domain_exception import DomainException


class CannotBanSelfException(DomainException):
    def __init__(self):
        super().__init__(message="No puede banearse a si mismo!! >=[", status_code=400)