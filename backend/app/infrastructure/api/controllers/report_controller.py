from urllib.parse import quote

from fastapi import APIRouter, Depends, Response

from app.application.use_cases.export_game_profile_report import ExportGameProfileReport
from app.application.use_cases.generate_game_profile_report import GenerateGameProfileReport
from app.infrastructure.api.dependencies.auth import get_current_user_id, require_admin
from app.infrastructure.api.dto.request.generate_game_profile_report_request import GenerateGameProfileReportRequest
from app.infrastructure.api.dto.response.get.generate_game_profile_report_response import \
    GenerateGameProfileReportResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


@router.post("/game-profiles", response_model=GenerateGameProfileReportResponse, status_code=201, dependencies=[Depends(require_admin)])
def generate_game_profile_report(request: GenerateGameProfileReportRequest, admin_id: int = Depends(get_current_user_id)):
    uow = uow_factory()
    use_case = GenerateGameProfileReport(uow)
    return use_case.execute(request, admin_id)


@router.get("/game-profiles/{report_id}/export", status_code=200,dependencies=[Depends(require_admin)])
def export_game_profile_report(report_id: int, report_output_format: str = "csv"):
    uow = uow_factory()
    use_case = ExportGameProfileReport(uow)
    filename, content = use_case.execute(report_id, report_output_format)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"}
    )
