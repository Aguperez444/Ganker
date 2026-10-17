from app.domain.exceptions.domain_exception import DomainException


class NoUsageDataForReportException(DomainException):
    def __init__(self, detail: str):
        super().__init__(
            message=f"No hay datos suficientes para generar el reporte: {detail}.",
            status_code=404
        )
