from datetime import datetime

from app.domain.exceptions.domain_exception import DomainException


class ReportStartDateBeforePreviousException(DomainException):
    def __init__(self, previous_end_date: datetime):
        super().__init__(
            message=('La fecha inicial del nuevo reporte no puede ser menor a la fecha final del último '
                     f'reporte previo ({previous_end_date.date().isoformat()}).'),
            status_code=400
        )
