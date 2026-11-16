from app.domain.exceptions.domain_exception import DomainException


class InvalidBanAppealImageExtensionException(DomainException):
    def __init__(self):
        super().__init__(
            message="Adjuntá imágenes PNG, JPG o WebP.",
            status_code=422,
        )
