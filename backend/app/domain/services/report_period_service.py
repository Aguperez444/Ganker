from datetime import date, datetime, time
from typing import Optional

from app.domain.exceptions.report.report_start_date_before_previous_exception import ReportStartDateBeforePreviousException
from app.domain.exceptions.report.invalid_report_date_range_exception import InvalidReportDateRangeException


class ReportPeriodService:
    """Reglas de coherencia temporal de los reportes respecto al reporte previo, comunes a todos los reportes."""

    @staticmethod
    def normalize(start_date: Optional[date], end_date: Optional[date]) -> tuple[Optional[datetime], Optional[datetime]]:
        start = datetime.combine(start_date, time.min) if start_date else None
        end = datetime.combine(end_date, time.max) if end_date else None
        if start is not None and end is not None and start > end:
            raise InvalidReportDateRangeException()
        return start, end

    @staticmethod
    def label(start_date: Optional[datetime], end_date: Optional[datetime]) -> str:
        if start_date is None and end_date is None:
            return "Período: histórico acumulado"
        start = start_date.date().isoformat() if start_date else "inicio"
        end = end_date.date().isoformat() if end_date else "fecha de generación"
        return f"Período: {start} a {end}"

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
