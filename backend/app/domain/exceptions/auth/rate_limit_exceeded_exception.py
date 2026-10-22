from app.domain.exceptions.domain_exception import DomainException


class RateLimitExceededException(DomainException):
    def __init__(self, message: str, retry_after: int):
        super().__init__(message=message, status_code=429)
        self.retry_after = retry_after
