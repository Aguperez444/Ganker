from app.domain.exceptions.domain_exception import DomainException


class FileNotNullException(DomainException):
    def __init__(self):
        super().__init__(message="El archivo no puede ser nulo cuando se proporciona un nombre de archivo.",
                         status_code=400)