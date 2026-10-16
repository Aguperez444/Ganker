from app.domain.exceptions.domain_exception import DomainException


class UnsupportedReportFormatException(DomainException):
    def __init__(self, report_format: str):
        super().__init__(
            message=f'El formato de exportación "{report_format}" no es soportado. Formatos válidos: csv, pdf, excel.',
            status_code=400
        )
