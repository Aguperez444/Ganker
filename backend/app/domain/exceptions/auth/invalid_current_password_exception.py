from app.domain.exceptions.domain_exception import DomainException


class InvalidCurrentPasswordException(DomainException):
    def __init__(self):
        super().__init__(
            message="La contraseña actual es incorrecta. Si tu cuenta no tiene contraseña, configurá una antes de cambiar el email.",
            status_code=400,
        )
