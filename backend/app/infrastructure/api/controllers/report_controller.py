from urllib.parse import quote

from fastapi import APIRouter, Depends, Response

from app.application.use_cases.export_game_profile_report import CSV_FORMAT, ExportGameProfileReport
from app.application.use_cases.export_game_usage_report import ExportGameUsageReport
from app.application.use_cases.generate_game_profile_report import GenerateGameProfileReport
from app.application.use_cases.generate_game_usage_report import GenerateGameUsageReport
from app.application.use_cases.query_game_profile_reports import QueryGameProfileReports
from app.application.use_cases.query_last_game_profile_report import QueryLastGameProfileReport
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_admin
from app.infrastructure.api.dto.request.generate_game_profile_report_request import GenerateGameProfileReportRequest
from app.infrastructure.api.dto.request.generate_game_usage_report_request import GenerateGameUsageReportRequest
from app.infrastructure.api.dto.response.get.generate_game_profile_report_response import GenerateGameProfileReportResponse
from app.infrastructure.api.dto.response.get.generate_game_usage_report_response import GenerateGameUsageReportResponse
from app.infrastructure.api.dto.response.get.get_game_profile_reports_response import GetGameProfileReportsResponse
from app.infrastructure.api.dto.response.get.get_last_game_profile_report_response import GetLastGameProfileReportResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


@router.post("/game-profiles", response_model=GenerateGameProfileReportResponse, status_code=201, dependencies=[Depends(require_admin)])
def generate_game_profile_report(request: GenerateGameProfileReportRequest, admin_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    use_case = GenerateGameProfileReport(uow)
    return use_case.execute(request, admin_id)


@router.post("/game-usage", response_model=GenerateGameUsageReportResponse, status_code=201, dependencies=[Depends(require_admin)])
def generate_game_usage_report(request: GenerateGameUsageReportRequest, admin_id: int = Depends(get_current_user_id)):
    # Genera y persiste un reporte de uso para un videojuego específico: distribución de jugadores por
    # rango, personajes más utilizados o equipos por franja de rangos. Devuelve el reporte con su id.
    uow = uow_factory()
    use_case = GenerateGameUsageReport(uow)
    return use_case.execute(request, admin_id)


@router.get("/game-usage/{report_id}/export", status_code=200, dependencies=[Depends(require_admin)])
def export_game_usage_report(report_id: int, report_output_format: str = CSV_FORMAT):
    # Recupera de la base de datos un reporte de uso previamente generado y lo exporta a un
    # archivo descargable (CSV, PDF o Excel). No vuelve a calcular el reporte.
    uow = uow_factory()
    use_case = ExportGameUsageReport(uow)
    exported = use_case.execute(report_id, report_output_format)
    return Response(
        content=exported.content,
        media_type=exported.media_type,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(exported.filename)}"}
    )


@router.get("/game-profiles", response_model=GetGameProfileReportsResponse, status_code=200, dependencies=[Depends(require_admin)])
def get_game_profile_reports():
    # Listado de reportes generados (id y fechas) para mostrar la tabla y sus botones de exportación
    uow = uow_factory()
    use_case = QueryGameProfileReports(uow)
    return use_case.execute()


@router.get("/game-profiles/last", response_model=GetLastGameProfileReportResponse, status_code=200, dependencies=[Depends(require_admin)])
def get_last_game_profile_report():
    # Devuelve la fecha del último reporte generado para que el frontend preseleccione un rango válido
    uow = uow_factory()
    use_case = QueryLastGameProfileReport(uow)
    return use_case.execute()


@router.get("/game-profiles/{report_id}/export", status_code=200, dependencies=[Depends(require_admin)])
def export_game_profile_report(report_id: int, report_output_format: str = CSV_FORMAT):
    uow = uow_factory()
    use_case = ExportGameProfileReport(uow)
    exported = use_case.execute(report_id, report_output_format)
    return Response(
        content=exported.content,
        media_type=exported.media_type,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(exported.filename)}"}
    )
