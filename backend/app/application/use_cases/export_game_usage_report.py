from app.domain.services.report_period_service import ReportPeriodService
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
            title=("Reporte general de equipos por videojuego"
                   if report.videogame_id is None and analysis is ReportAnalysisType.TEAMS
                   else _TITLE_BY_ANALYSIS.get(analysis, _DEFAULT_TITLE)),
            meta_lines=[
                self._scope_label(report),
                self._period_label(report),
                f"Generado el {report.generated_at.strftime('%Y-%m-%d %H:%M')}",
                f"Total considerado: {report.total}",
                f"Reporte #{report.report_id}; comparación: {report.previous_report_id or 'sin reporte previo'}",
                ("Equipos registrados en el período, activos e inactivos." if analysis is ReportAnalysisType.TEAMS
                 else "Perfiles vigentes creados en el período; no mide sesiones ni actividad de juego."),
                ("Porcentaje sobre equipos del alcance seleccionado." if analysis is ReportAnalysisType.TEAMS
                 else "Porcentaje sobre perfiles del alcance seleccionado; las categorías pueden superponerse y sumar más de 100 %."),
            ],
            headers=(["VIDEOJUEGO", "EQUIPOS", "PORCENTAJE", "VARIACION", "VARIACION %", "TENDENCIA"]
                     if report.videogame_id is None and analysis is ReportAnalysisType.TEAMS
                     else _HEADERS_BY_ANALYSIS.get(analysis, _DEFAULT_HEADERS)),
            rows=[self._row_values(item) for item in report.items],
            total_row=["TOTAL", report.total, 100.0 if analysis is ReportAnalysisType.TEAMS and report.items else None,
                       None, None, None],
            column_widths=_COLUMN_WIDTHS,
            pdf_decimal_columns=_PDF_DECIMAL_COLUMNS,
        )

    @staticmethod
    def _base_filename(report) -> str:
        scope = f"videojuego_{report.videogame_id}" if report.videogame_id is not None else "general"
        return f"reporte_uso_{report.analysis_type}_{scope}_{report.report_id}"

    @staticmethod
    def _scope_label(report) -> str:
        return f"Videojuego: {report.videogame_name}"

    @staticmethod
    def _period_label(report) -> str:
        return ReportPeriodService.label(report.start_date, report.end_date)

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
