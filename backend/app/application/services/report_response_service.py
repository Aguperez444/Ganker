from app.domain.models.game_profile_report import GameProfileReport
from app.domain.models.game_usage_report import GameUsageReport
from app.infrastructure.api.dto.response.get.game_profile_report_item_response import GameProfileReportItemResponse
from app.infrastructure.api.dto.response.get.game_usage_report_item_response import GameUsageReportItemResponse
from app.infrastructure.api.dto.response.get.generate_game_profile_report_response import GenerateGameProfileReportResponse
from app.infrastructure.api.dto.response.get.generate_game_usage_report_response import GenerateGameUsageReportResponse


def game_profile_report_response(report: GameProfileReport) -> GenerateGameProfileReportResponse:
    return GenerateGameProfileReportResponse(
        report_id=report.report_id,
        generated_by=report.generated_by,
        generated_at=report.generated_at,
        start_date=report.start_date,
        end_date=report.end_date,
        total_profiles=report.total_profiles,
        has_previous_report=report.previous_report_id is not None,
        previous_report_id=report.previous_report_id,
        items=[
            GameProfileReportItemResponse(
                videogame_id=item.videogame_id,
                videogame_name=item.videogame_name,
                icon_url=item.icon_url,
                profile_count=item.profile_count,
                percentage=item.percentage,
                variation=item.variation,
                variation_percentage=item.variation_percentage,
                trend=item.trend,
            )
            for item in report.items
        ],
    )


def game_usage_report_response(report: GameUsageReport) -> GenerateGameUsageReportResponse:
    return GenerateGameUsageReportResponse(
        report_id=report.report_id,
        generated_by=report.generated_by,
        analysis_type=report.analysis_type,
        videogame_id=report.videogame_id,
        videogame_name=report.videogame_name,
        icon_url=report.icon_url,
        start_date=report.start_date,
        end_date=report.end_date,
        generated_at=report.generated_at,
        total=report.total,
        has_previous_report=report.previous_report_id is not None,
        previous_report_id=report.previous_report_id,
        items=[
            GameUsageReportItemResponse(
                category_id=item.category_id,
                name=item.name,
                icon_url=item.icon_url,
                count=item.count,
                percentage=item.percentage,
                rank_range=item.rank_range,
                variation=item.variation,
                variation_percentage=item.variation_percentage,
                trend=item.trend,
            )
            for item in report.items
        ],
    )
