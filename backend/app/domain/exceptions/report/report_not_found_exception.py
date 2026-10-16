from app.domain.exceptions.domain_exception import DomainException


class ReportNotFoundException(DomainException):
    def __init__(self, report_id: int):
        super().__init__(
            message=f'El reporte con id {report_id} no fue encontrado.',
            status_code=404
        )
