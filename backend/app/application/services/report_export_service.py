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

from app.domain.exceptions.report.unsupported_report_format_exception import UnsupportedReportFormatException

CSV_FORMAT = "csv"
PDF_FORMAT = "pdf"
EXCEL_FORMAT = "excel"

CSV_MEDIA_TYPE = "text/csv"
PDF_MEDIA_TYPE = "application/pdf"
EXCEL_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

SUPPORTED_FORMATS = (CSV_FORMAT, PDF_FORMAT, EXCEL_FORMAT)

_REPORT_AUTHOR = "Ganker"
_EXCEL_SHEET_TITLE = "Reporte"

# Estilo visual común de la tabla en PDF (mismo formato para todos los reportes).
_PDF_TABLE_STYLE = (
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2C3E50")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#ECEFF1")),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ("ALIGN", (1, 1), (-1, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("FONTSIZE", (0, 0), (-1, -1), 9),
)


@dataclass
class ExportedReportFile:
    """Archivo exportado listo para descargar, independiente del tipo de reporte."""

    filename: str
    content: bytes
    media_type: str


@dataclass
class ReportTable:
    """
    Representación tabular neutra de un reporte, lista para exportar. El dominio de cada reporte se
    traduce a esta estructura y el servicio se encarga del formato de salida (CSV, PDF o Excel).
    """

    title: str
    meta_lines: list[str]
    headers: list[str]
    rows: list[list]
    total_row: list
    column_widths: list[int]
    pdf_decimal_columns: tuple[int, ...] = ()


class ReportExportService:
    """Centraliza el render de exportación (CSV, PDF y Excel) común a todos los reportes."""

    @staticmethod
    def ensure_supported_format(report_format: str) -> str:
        normalized = (report_format or CSV_FORMAT).lower()
        if normalized not in SUPPORTED_FORMATS:
            raise UnsupportedReportFormatException(normalized)
        return normalized

    @classmethod
    def build(cls, report_format: str, base_filename: str, table: ReportTable) -> ExportedReportFile:
        report_format = cls.ensure_supported_format(report_format)

        if report_format == CSV_FORMAT:
            return ExportedReportFile(f"{base_filename}.csv", cls._build_csv(table), CSV_MEDIA_TYPE)
        if report_format == PDF_FORMAT:
            return ExportedReportFile(f"{base_filename}.pdf", cls._build_pdf(table), PDF_MEDIA_TYPE)
        return ExportedReportFile(f"{base_filename}.xlsx", cls._build_excel(table), EXCEL_MEDIA_TYPE)

    # ---------------------------------------------------------
    # CSV
    # ---------------------------------------------------------

    @classmethod
    def _build_csv(cls, table: ReportTable) -> bytes:
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(table.headers)
        for row in table.rows:
            writer.writerow(cls._csv_cells(row))
        writer.writerow([])
        writer.writerow(cls._csv_cells(table.total_row))
        return buffer.getvalue().encode("utf-8")

    @staticmethod
    def _csv_cells(row: list) -> list:
        return ["" if cell is None else cell for cell in row]

    # ---------------------------------------------------------
    # PDF
    # ---------------------------------------------------------

    @classmethod
    def _build_pdf(cls, table: ReportTable) -> bytes:
        buffer = io.BytesIO()
        document = SimpleDocTemplate(buffer, pagesize=A4, title=table.title, author=_REPORT_AUTHOR)
        styles = getSampleStyleSheet()

        elements = [Paragraph(table.title, styles["Title"])]
        elements += [Paragraph(line, styles["Normal"]) for line in table.meta_lines]
        elements.append(Spacer(1, 0.5 * cm))

        data = [table.headers]
        data += [cls._pdf_cells(row, table.pdf_decimal_columns) for row in table.rows]
        data.append(cls._pdf_cells(table.total_row, table.pdf_decimal_columns))

        pdf_table = Table(data, repeatRows=1, hAlign="LEFT")
        pdf_table.setStyle(TableStyle(_PDF_TABLE_STYLE))
        elements.append(pdf_table)

        document.build(elements)
        return buffer.getvalue()

    @staticmethod
    def _pdf_cells(row: list, decimal_columns: tuple[int, ...]) -> list[str]:
        cells = []
        for index, cell in enumerate(row):
            if cell is None or cell == "":
                cells.append("")
            elif index in decimal_columns and isinstance(cell, float):
                cells.append(f"{cell:.2f}")
            else:
                cells.append(str(cell))
        return cells

    # ---------------------------------------------------------
    # Excel
    # ---------------------------------------------------------

    @classmethod
    def _build_excel(cls, table: ReportTable) -> bytes:
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = _EXCEL_SHEET_TITLE

        worksheet.append([table.title])
        for line in table.meta_lines:
            worksheet.append([line])
        worksheet.append([])

        worksheet.append(table.headers)
        header_row = worksheet.max_row
        for cell in worksheet[header_row]:
            cell.font = Font(bold=True)

        for row in table.rows:
            worksheet.append(row)
        worksheet.append(table.total_row)

        for column_index, width in enumerate(table.column_widths, start=1):
            worksheet.column_dimensions[chr(64 + column_index)].width = width

        buffer = io.BytesIO()
        workbook.save(buffer)
        return buffer.getvalue()
