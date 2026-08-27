from app.domain.exceptions.domain_exception import DomainException



class WrongPasswordException(DomainException):
    def __init__(self, email: str):
        super().__init__(
            message=f"La contraseña es incorrecta para el email {email}.",
            status_code=401
        )
