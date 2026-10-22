from app.domain.exceptions.domain_exception import DomainException


class InsufficientPermissionsException(DomainException):
    def __init__(self):
        super().__init__(
            message="No tienes permisos suficientes para realizar esta acción",
            status_code=403
        )
