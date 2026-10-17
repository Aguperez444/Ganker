from datetime import datetime
from typing import Optional

from app.domain.exceptions.report.report_start_date_before_previous_exception import ReportStartDateBeforePreviousException


class ReportPeriodService:
    """Reglas de coherencia temporal de los reportes respecto al reporte previo, comunes a todos los reportes."""

    @staticmethod
    def validate_start_not_before_previous(start_date: Optional[datetime],
                                           previous_end_date: Optional[datetime]) -> None:
        """
        Verifica que la fecha inicial del nuevo reporte sea igual o posterior a la fecha final del
        reporte previo. Si la fecha inicial no se especifica (histórico acumulado) o el reporte previo
        no tiene fecha de fin, no hay nada que validar.
        """
        if start_date is not None and previous_end_date is not None and start_date < previous_end_date:
            raise ReportStartDateBeforePreviousException(previous_end_date)
