from app.domain.exceptions.domain_exception import DomainException


class MailAlreadyExistsException(DomainException):
    def __init__(self, mail: str):
        super().__init__(
            message=f'El correo: "{mail}" ya está ocupado.',
            status_code=409
        )