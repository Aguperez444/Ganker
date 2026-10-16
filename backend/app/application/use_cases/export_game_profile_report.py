import csv
import io
from dataclasses import dataclass

from openpyxl import Workbook
from openpyxl.styles import Font
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.report.report_not_found_exception import ReportNotFoundException
from app.domain.exceptions.report.unsupported_report_format_exception import UnsupportedReportFormatException

CSV_FORMAT = "csv"
PDF_FORMAT = "pdf"
EXCEL_FORMAT = "excel"

CSV_MEDIA_TYPE = "text/csv"
PDF_MEDIA_TYPE = "application/pdf"
EXCEL_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

_REPORT_TITLE = "Reporte de perfiles de jugador por videojuego"
_ITEM_HEADERS = ["VIDEOJUEGO", "PERFILES", "PORCENTAJE", "VARIACION", "VARIACION_PORCENTAJE", "TENDENCIA"]


@dataclass
class ExportedReportFile:
    filename: str
    content: bytes
    media_type: str


class ExportGameProfileReport:
    """Exporta un reporte previamente generado a un formato descargable (CSV, PDF o Excel)."""

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, report_id: int, report_format: str = CSV_FORMAT) -> ExportedReportFile:
        report_format = (report_format or CSV_FORMAT).lower()

        if report_format not in (CSV_FORMAT, PDF_FORMAT, EXCEL_FORMAT):
            raise UnsupportedReportFormatException(report_format)

        with self.uow as uow:
            report = uow.game_profile_report_repo.get_report_by_id(report_id)
            if report is None:
                raise ReportNotFoundException(report_id)

            if report_format == CSV_FORMAT:
                content = self._build_csv(report)
                return ExportedReportFile(
                    filename=f"reporte_perfiles_por_videojuego_{report.report_id}.csv",
                    content=content,
                    media_type=CSV_MEDIA_TYPE,
                )

            if report_format == PDF_FORMAT:
                content = self._build_pdf(report)
                return ExportedReportFile(
                    filename=f"reporte_perfiles_por_videojuego_{report.report_id}.pdf",
                    content=content,
                    media_type=PDF_MEDIA_TYPE,
                )

            content = self._build_excel(report)
            return ExportedReportFile(
                filename=f"reporte_perfiles_por_videojuego_{report.report_id}.xlsx",
                content=content,
                media_type=EXCEL_MEDIA_TYPE,
            )

    # ---------------------------------------------------------
    # Utilidades compartidas
    # ---------------------------------------------------------

    def _period_label(self, report) -> str:
        if report.start_date is None and report.end_date is None:
            return "Período: histórico total"
        start = report.start_date.date().isoformat() if report.start_date else "inicio"
        end = report.end_date.date().isoformat() if report.end_date else "hoy"
        return f"Período: {start} a {end}"

    def _row_values(self, item) -> list:
        return [
            item.videogame_name,
            item.profile_count,
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
        writer.writerow(_ITEM_HEADERS)
        for item in report.items:
            writer.writerow(self._row_values(item))
        writer.writerow([])
        writer.writerow(["TOTAL", report.total_profiles, 100.0, "", "", ""])
        return buffer.getvalue().encode("utf-8")

    # ---------------------------------------------------------
    # PDF
    # ---------------------------------------------------------

    def _build_pdf(self, report) -> bytes:
        buffer = io.BytesIO()
        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            title=_REPORT_TITLE,
            author="Ganker",
        )
        styles = getSampleStyleSheet()

        elements = [
            Paragraph(_REPORT_TITLE, styles["Title"]),
            Paragraph(self._period_label(report), styles["Normal"]),
            Paragraph(f"Generado el {report.generated_at.strftime('%Y-%m-%d %H:%M')}", styles["Normal"]),
            Paragraph(f"Total general de perfiles: {report.total_profiles}", styles["Normal"]),
            Spacer(1, 0.5 * cm),
        ]

        data = [_ITEM_HEADERS]
        for item in report.items:
            data.append([
                item.videogame_name,
                str(item.profile_count),
                f"{item.percentage:.2f}",
                "" if item.variation is None else str(item.variation),
                "" if item.variation_percentage is None else f"{item.variation_percentage:.2f}",
                "" if item.trend is None else item.trend,
            ])
        data.append(["TOTAL", str(report.total_profiles), "100.00", "", "", ""])

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

        worksheet.append([_REPORT_TITLE])
        worksheet.append([self._period_label(report)])
        worksheet.append([f"Generado el {report.generated_at.strftime('%Y-%m-%d %H:%M')}"])
        worksheet.append([f"Total general de perfiles: {report.total_profiles}"])
        worksheet.append([])

        worksheet.append(_ITEM_HEADERS)
        header_row = worksheet.max_row
        for cell in worksheet[header_row]:
            cell.font = Font(bold=True)

        for item in report.items:
            worksheet.append(self._row_values(item))

        worksheet.append(["TOTAL", report.total_profiles, 100.0, None, None, None])

        for column_index, width in enumerate([24, 10, 12, 12, 18, 12], start=1):
            worksheet.column_dimensions[chr(64 + column_index)].width = width

        buffer = io.BytesIO()
        workbook.save(buffer)
        return buffer.getvalue()
