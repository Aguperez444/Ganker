from app.domain.exceptions.domain_exception import DomainException


class BanAppealImageTooLargeException(DomainException):
    def __init__(self):
        super().__init__(
            message="Cada imagen puede pesar hasta 2 MB.",
            status_code=413,
        )
