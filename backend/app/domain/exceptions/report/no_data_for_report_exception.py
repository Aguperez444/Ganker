from app.domain.exceptions.domain_exception import DomainException


class NoDataForReportException(DomainException):
    def __init__(self):
        super().__init__(
            message='No hay datos suficientes para generar el reporte: no existen perfiles de jugador registrados en la plataforma.',
            status_code=404
        )
