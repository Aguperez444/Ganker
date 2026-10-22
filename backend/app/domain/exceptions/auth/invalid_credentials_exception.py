from app.domain.exceptions.domain_exception import DomainException


class InvalidCredentialsException(DomainException):
    def __init__(self):
        super().__init__("El correo o la contraseña son incorrectos.", status_code=401)
