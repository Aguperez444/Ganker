from app.domain.exceptions.domain_exception import DomainException


class BanNotFinishedException(DomainException):
    def __init__(self):
        super().__init__(message="El baneo del jugador aún no ha finalizado", status_code=400)