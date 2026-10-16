from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.services.report_export_service import (
    CSV_FORMAT,
    ExportedReportFile,
    ReportExportService,
    ReportTable,
)
from app.domain.exceptions.report.report_not_found_exception import ReportNotFoundException
from app.domain.models.report_analysis_type import ReportAnalysisType

_TITLE_BY_ANALYSIS = {
    ReportAnalysisType.RANKS: "Reporte de distribución de jugadores por rango",
    ReportAnalysisType.CHARACTERS: "Reporte de personajes más utilizados",
    ReportAnalysisType.TEAMS: "Reporte de equipos por franja de rangos",
}

_HEADERS_BY_ANALYSIS = {
    ReportAnalysisType.RANKS: ["RANGO", "JUGADORES", "PORCENTAJE", "VARIACION", "VARIACION %", "TENDENCIA"],
    ReportAnalysisType.CHARACTERS: ["PERSONAJE", "VECES_ELEGIDO", "PORCENTAJE", "VARIACION", "VARIACION %", "TENDENCIA"],
    ReportAnalysisType.TEAMS: ["FRANJA", "EQUIPOS", "PORCENTAJE", "VARIACION", "VARIACION %", "TENDENCIA"],
}

_DEFAULT_TITLE = "Reporte de uso"
_DEFAULT_HEADERS = ["CATEGORIA", "CANTIDAD", "PORCENTAJE"]
_COLUMN_WIDTHS = [32, 12, 12, 12, 14, 12]
_PDF_DECIMAL_COLUMNS = (2, 4)


class ExportGameUsageReport:
    """Exporta un reporte de uso previamente generado y persistido a un formato descargable (CSV, PDF o Excel)."""

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, report_id: int, report_output_format: str = CSV_FORMAT) -> ExportedReportFile:
        report_output_format = ReportExportService.ensure_supported_format(report_output_format)

        with self.uow as uow:
            report = uow.game_usage_report_repo.get_report_by_id(report_id)
            if report is None:
                raise ReportNotFoundException(report_id)

        return ReportExportService.build(
            report_output_format,
            self._base_filename(report),
            self._build_table(report),
        )

    def _build_table(self, report) -> ReportTable:
        analysis = ReportAnalysisType.try_from_value(report.analysis_type)

        return ReportTable(
            title=_TITLE_BY_ANALYSIS.get(analysis, _DEFAULT_TITLE),
            meta_lines=[
                self._scope_label(report),
                self._period_label(report),
                f"Generado el {report.generated_at.strftime('%Y-%m-%d %H:%M')}",
                f"Total considerado: {report.total}",
            ],
            headers=_HEADERS_BY_ANALYSIS.get(analysis, _DEFAULT_HEADERS),
            rows=[self._row_values(item) for item in report.items],
            total_row=["TOTAL", report.total, 100.0 if report.items else 0.0, None, None, None],
            column_widths=_COLUMN_WIDTHS,
            pdf_decimal_columns=_PDF_DECIMAL_COLUMNS,
        )

    @staticmethod
    def _base_filename(report) -> str:
        return f"reporte_uso_{report.analysis_type}_videojuego_{report.videogame_id}"

    @staticmethod
    def _scope_label(report) -> str:
        return f"Videojuego: {report.videogame_name}"

    @staticmethod
    def _period_label(report) -> str:
        if report.start_date is None and report.end_date is None:
            return "Período: histórico acumulado"
        start = report.start_date.date().isoformat() if report.start_date else "inicio"
        end = report.end_date.date().isoformat() if report.end_date else "hoy"
        return f"Período: {start} a {end}"

    @staticmethod
    def _row_values(item) -> list:
        return [
            item.name,
            item.count,
            item.percentage,
            item.variation,
            item.variation_percentage,
            item.trend,
        ]
