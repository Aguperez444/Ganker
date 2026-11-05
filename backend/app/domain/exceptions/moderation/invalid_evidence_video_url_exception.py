from app.domain.exceptions.domain_exception import DomainException


class InvalidEvidenceVideoUrlException(DomainException):
    def __init__(self):
        super().__init__(message="El link de evidencia debe ser un video de YouTube válido.", status_code=400)
