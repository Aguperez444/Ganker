from app.domain.exceptions.domain_exception import DomainException


class InvalidNameFileException(DomainException):
    def __init__(self, filename: str):
        super().__init__(
            message=f'The file name "{filename}" is invalid.',
            status_code=400
        )