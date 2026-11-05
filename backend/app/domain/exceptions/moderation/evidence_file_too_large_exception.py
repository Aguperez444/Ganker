from app.domain.exceptions.domain_exception import DomainException


class EvidenceFileTooLargeException(DomainException):
    def __init__(self, max_mb: int):
        super().__init__(message=f"La imagen de evidencia no puede superar los {max_mb} MB.", status_code=400)
