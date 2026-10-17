from app.domain.exceptions.domain_exception import DomainException


class InvalidReportDateRangeException(DomainException):
    def __init__(self):
        super().__init__(
            message='El rango de fechas es inválido: la fecha inicial no puede ser posterior a la fecha final.',
            status_code=400
        )
