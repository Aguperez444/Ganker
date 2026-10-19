from app.domain.exceptions.domain_exception import DomainException


class NotCanAutoUnbanException(DomainException):
    def __init__(self):
        super().__init__(message="No podés desbanearte a vos mismo ¿Cómo siquiera llegaste acá?", status_code=403)