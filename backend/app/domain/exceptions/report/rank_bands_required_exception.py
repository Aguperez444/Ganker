from app.domain.exceptions.domain_exception import DomainException


class RankBandsRequiredException(DomainException):
    def __init__(self):
        super().__init__(
            message='El análisis de equipos requiere que se especifiquen las franjas de rangos a evaluar.',
            status_code=400
        )
