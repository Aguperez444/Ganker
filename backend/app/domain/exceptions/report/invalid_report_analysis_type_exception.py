from app.domain.exceptions.domain_exception import DomainException


class InvalidReportAnalysisTypeException(DomainException):
    def __init__(self, analysis_type: str):
        super().__init__(
            message=f'El tipo de análisis "{analysis_type}" no es válido. Tipos válidos: ranks (rangos), characters (personajes), teams (equipos).',
            status_code=400
        )
