import csv
import io

from openpyxl import Workbook
from openpyxl.styles import Font
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.use_cases.export_game_profile_report import (
    CSV_FORMAT,
    CSV_MEDIA_TYPE,
    EXCEL_FORMAT,
    EXCEL_MEDIA_TYPE,
    ExportedReportFile,
    PDF_FORMAT,
    PDF_MEDIA_TYPE,
)
from app.application.use_cases.generate_game_usage_report import (
    ANALYSIS_CHARACTERS,
    ANALYSIS_RANKS,
    ANALYSIS_TEAMS,
)
from app.domain.exceptions.report.report_not_found_exception import ReportNotFoundException
from app.domain.exceptions.report.unsupported_report_format_exception import UnsupportedReportFormatException

_SUPPORTED_FORMATS = (CSV_FORMAT, PDF_FORMAT, EXCEL_FORMAT)

_TITLE_BY_ANALYSIS = {
    ANALYSIS_RANKS: "Reporte de distribución de jugadores por rango",
    ANALYSIS_CHARACTERS: "Reporte de personajes más utilizados",
    ANALYSIS_TEAMS: "Reporte de equipos por franja de rangos",
}

_HEADERS_BY_ANALYSIS = {
    ANALYSIS_RANKS: ["RANGO", "JUGADORES", "PORCENTAJE", "VARIACION", "VARIACION %", "TENDENCIA"],
    ANALYSIS_CHARACTERS: ["PERSONAJE", "VECES_ELEGIDO", "PORCENTAJE", "VARIACION", "VARIACION %", "TENDENCIA"],
    ANALYSIS_TEAMS: ["FRANJA", "EQUIPOS", "PORCENTAJE", "VARIACION", "VARIACION %", "TENDENCIA"],
}


class ExportGameUsageReport:
    """Exporta un reporte de uso previamente generado y persistido a un formato descargable (CSV, PDF o Excel)."""

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, report_id: int, report_output_format: str = CSV_FORMAT) -> ExportedReportFile:
        report_output_format = (report_output_format or CSV_FORMAT).lower()

        if report_output_format not in _SUPPORTED_FORMATS:
            raise UnsupportedReportFormatException(report_output_format)

        with self.uow as uow:
            report = uow.game_usage_report_repo.get_report_by_id(report_id)
            if report is None:
                raise ReportNotFoundException(report_id)

        base_name = self._base_filename(report)

        if report_output_format == CSV_FORMAT:
            return ExportedReportFile(
                filename=f"{base_name}.csv",
                content=self._build_csv(report),
                media_type=CSV_MEDIA_TYPE,
            )
        elif report_output_format == PDF_FORMAT:
            return ExportedReportFile(
                filename=f"{base_name}.pdf",
                content=self._build_pdf(report),
                media_type=PDF_MEDIA_TYPE,
            )

        return ExportedReportFile(
            filename=f"{base_name}.xlsx",
            content=self._build_excel(report),
            media_type=EXCEL_MEDIA_TYPE,
        )

    # ---------------------------------------------------------
    # Utilidades compartidas
    # ---------------------------------------------------------

    @staticmethod
    def _base_filename(report) -> str:
        return f"reporte_uso_{report.analysis_type}_videojuego_{report.videogame_id}"

    @staticmethod
    def _title(report) -> str:
        return _TITLE_BY_ANALYSIS.get(report.analysis_type, "Reporte de uso")

    @staticmethod
    def _headers(report) -> list[str]:
        return _HEADERS_BY_ANALYSIS.get(report.analysis_type, ["CATEGORIA", "CANTIDAD", "PORCENTAJE"])

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
            item.variation if item.variation is not None else "",
            item.variation_percentage if item.variation_percentage is not None else "",
            item.trend if item.trend is not None else "",
        ]

    # ---------------------------------------------------------
    # CSV
    # ---------------------------------------------------------

    def _build_csv(self, report) -> bytes:
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(self._headers(report))
        for item in report.items:
            writer.writerow(self._row_values(item))
        writer.writerow([])
        writer.writerow(["TOTAL", report.total, 100.0 if report.items else 0.0, "", "", ""])
        return buffer.getvalue().encode("utf-8")

    # ---------------------------------------------------------
    # PDF
    # ---------------------------------------------------------

    def _build_pdf(self, report) -> bytes:
        buffer = io.BytesIO()
        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            title=self._title(report),
            author="Ganker",
        )
        styles = getSampleStyleSheet()

        elements = [
            Paragraph(self._title(report), styles["Title"]),
            Paragraph(self._scope_label(report), styles["Normal"]),
            Paragraph(self._period_label(report), styles["Normal"]),
            Paragraph(f"Generado el {report.generated_at.strftime('%Y-%m-%d %H:%M')}", styles["Normal"]),
            Paragraph(f"Total considerado: {report.total}", styles["Normal"]),
            Spacer(1, 0.5 * cm),
        ]

        headers = self._headers(report)
        data = [headers]
        for item in report.items:
            data.append([
                item.name,
                str(item.count),
                f"{item.percentage:.2f}",
                "" if item.variation is None else str(item.variation),
                "" if item.variation_percentage is None else f"{item.variation_percentage:.2f}",
                item.trend or "",
            ])
        data.append(["TOTAL", str(report.total), "100.00" if report.items else "0.00", "", "", ""])

        table = Table(data, repeatRows=1, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2C3E50")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#ECEFF1")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ALIGN", (1, 1), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ]))
        elements.append(table)

        document.build(elements)
        return buffer.getvalue()

    # ---------------------------------------------------------
    # Excel
    # ---------------------------------------------------------

    def _build_excel(self, report) -> bytes:
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = "Reporte"

        worksheet.append([self._title(report)])
        worksheet.append([self._scope_label(report)])
        worksheet.append([self._period_label(report)])
        worksheet.append([f"Generado el {report.generated_at.strftime('%Y-%m-%d %H:%M')}"])
        worksheet.append([f"Total considerado: {report.total}"])
        worksheet.append([])

        headers = self._headers(report)
        worksheet.append(headers)
        header_row = worksheet.max_row
        for cell in worksheet[header_row]:
            cell.font = Font(bold=True)

        for item in report.items:
            worksheet.append(self._row_values(item))

        worksheet.append(["TOTAL", report.total, 100.0 if report.items else 0.0, None, None, None])

        for column_index, width in enumerate([32, 12, 12, 12, 14, 12], start=1):
            worksheet.column_dimensions[chr(64 + column_index)].width = width

        buffer = io.BytesIO()
        workbook.save(buffer)
        return buffer.getvalue()
