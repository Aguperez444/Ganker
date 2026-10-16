import csv
import io

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.report.report_not_found_exception import ReportNotFoundException
from app.domain.exceptions.report.unsupported_report_format_exception import UnsupportedReportFormatException

CSV_FORMAT = "csv"


class ExportGameProfileReport:
    """Exporta un reporte previamente generado a un formato descargable (CSV)."""

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, report_id: int, report_format: str = CSV_FORMAT) -> tuple[str, str]:
        report_format = (report_format or CSV_FORMAT).lower()

        # todo próximamente añadir más estilos de reportes
        if report_format != CSV_FORMAT:
            raise UnsupportedReportFormatException(report_format)

        with self.uow as uow:
            report = uow.game_profile_report_repo.get_report_by_id(report_id)
            if report is None:
                raise ReportNotFoundException(report_id)

            content = self._build_csv(report)
            filename = f"reporte_perfiles_por_videojuego_{report.report_id}.csv"
            return filename, content

    def _build_csv(self, report) -> str:
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow([
            "VIDEOJUEGO",
            "PERFILES",
            "PORCENTAJE",
            "VARIACION",
            "VARIACION_PORCENTAJE",
            "TENDENCIA",
        ])
        for item in report.items:
            writer.writerow([
                item.videogame_name,
                item.profile_count,
                item.percentage,
                item.variation if item.variation is not None else "",
                item.variation_percentage if item.variation_percentage is not None else "",
                item.trend if item.trend is not None else "",
            ])
        writer.writerow([])
        writer.writerow(["TOTAL", report.total_profiles, 100.0, "", "", ""])
        return buffer.getvalue()
