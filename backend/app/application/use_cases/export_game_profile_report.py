from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.report.report_not_found_exception import ReportNotFoundException
from app.application.services.report_export_service import (
    CSV_FORMAT,
    CSV_MEDIA_TYPE,
    EXCEL_FORMAT,
    EXCEL_MEDIA_TYPE,
    PDF_FORMAT,
    PDF_MEDIA_TYPE,
    ExportedReportFile,
    ReportExportService,
    ReportTable,
)


# Reexportamos el contrato de exportación para no romper importaciones existentes.
__all__ = [
    "ExportGameProfileReport",
    "ExportedReportFile",
    "CSV_FORMAT",
    "PDF_FORMAT",
    "EXCEL_FORMAT",
    "CSV_MEDIA_TYPE",
    "PDF_MEDIA_TYPE",
    "EXCEL_MEDIA_TYPE",
]

_REPORT_TITLE = "Reporte de perfiles de jugador por videojuego"
_ITEM_HEADERS = ["VIDEOJUEGO", "PERFILES", "PORCENTAJE", "VARIACION", "VARIACION_PORCENTAJE", "TENDENCIA"]
_COLUMN_WIDTHS = [24, 10, 12, 12, 18, 12]
_PDF_DECIMAL_COLUMNS = (2, 4)


class ExportGameProfileReport:
    """Exporta un reporte previamente generado a un formato descargable (CSV, PDF o Excel)."""

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, report_id: int, report_format: str = CSV_FORMAT) -> ExportedReportFile:
        report_format = ReportExportService.ensure_supported_format(report_format)

        with self.uow as uow:
            report = uow.game_profile_report_repo.get_report_by_id(report_id)
            if report is None:
                raise ReportNotFoundException(report_id)

        return ReportExportService.build(
            report_format,
            f"reporte_perfiles_por_videojuego_{report.report_id}",
            self._build_table(report),
        )

    def _build_table(self, report) -> ReportTable:
        return ReportTable(
            title=_REPORT_TITLE,
            meta_lines=[
                self._period_label(report),
                f"Generado el {report.generated_at.strftime('%Y-%m-%d %H:%M')}",
                f"Total general de perfiles: {report.total_profiles}",
            ],
            headers=_ITEM_HEADERS,
            rows=[self._row_values(item) for item in report.items],
            total_row=["TOTAL", report.total_profiles, 100.0, None, None, None],
            column_widths=_COLUMN_WIDTHS,
            pdf_decimal_columns=_PDF_DECIMAL_COLUMNS,
        )

    @staticmethod
    def _period_label(report) -> str:
        if report.start_date is None and report.end_date is None:
            return "Período: histórico total"
        start = report.start_date.date().isoformat() if report.start_date else "inicio"
        end = report.end_date.date().isoformat() if report.end_date else "hoy"
        return f"Período: {start} a {end}"

    @staticmethod
    def _row_values(item) -> list:
        return [
            item.videogame_name,
            item.profile_count,
            item.percentage,
            item.variation,
            item.variation_percentage,
            item.trend,
        ]
