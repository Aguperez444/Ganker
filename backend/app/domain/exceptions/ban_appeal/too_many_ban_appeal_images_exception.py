from app.domain.exceptions.domain_exception import DomainException


class TooManyBanAppealImagesException(DomainException):
    def __init__(self):
        super().__init__(
            message="Podés adjuntar hasta 3 imágenes.",
            status_code=422,
        )
