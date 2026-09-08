from app.domain.exceptions.domain_exception import DomainException


class FileNotNullException(DomainException):
    def __init__(self):
        super().__init__(message="File cannot be null when a filename is provided.",
                         status_code=400)