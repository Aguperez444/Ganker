from app.domain.models.game_profile_report import GameProfileReport
from app.domain.models.game_profile_report_item import GameProfileReportItem
from app.infrastructure.database.models.game_profile_report_item_orm import GameProfileReportItemORM
from app.infrastructure.database.models.game_profile_report_orm import GameProfileReportORM


class GameProfileReportMapper:

    @staticmethod
    def orm_to_domain(report_orm: GameProfileReportORM) -> GameProfileReport:
        return GameProfileReport(
            report_id=report_orm.report_id,
            generated_by=report_orm.generated_by,
            generated_at=report_orm.generated_at,
            total_profiles=report_orm.total_profiles,
            items=[GameProfileReportMapper.item_orm_to_domain(item) for item in report_orm.items],
            start_date=report_orm.start_date,
            end_date=report_orm.end_date,
            previous_report_id=report_orm.previous_report_id,
        )

    @staticmethod
    def item_orm_to_domain(item_orm: GameProfileReportItemORM) -> GameProfileReportItem:
        return GameProfileReportItem(
            item_id=item_orm.item_id,
            videogame_id=item_orm.videogame_id,
            videogame_name=item_orm.videogame_name,
            icon_url=item_orm.icon_url,
            profile_count=item_orm.profile_count,
            percentage=item_orm.percentage,
            variation=item_orm.variation,
            variation_percentage=item_orm.variation_percentage,
            trend=item_orm.trend,
        )

    @staticmethod
    def domain_to_orm(report_domain: GameProfileReport) -> GameProfileReportORM:
        if report_domain.is_persisted():
            return GameProfileReportORM(
                report_id=report_domain.report_id,
                generated_by=report_domain.generated_by,
                previous_report_id=report_domain.previous_report_id,
                start_date=report_domain.start_date,
                end_date=report_domain.end_date,
                generated_at=report_domain.generated_at,
                total_profiles=report_domain.total_profiles,
                items=[GameProfileReportMapper.item_domain_to_orm(item) for item in report_domain.items],
            )
        else:
            return GameProfileReportORM(
                generated_by=report_domain.generated_by,
                previous_report_id=report_domain.previous_report_id,
                start_date=report_domain.start_date,
                end_date=report_domain.end_date,
                generated_at=report_domain.generated_at,
                total_profiles=report_domain.total_profiles,
                items=[GameProfileReportMapper.item_domain_to_orm(item) for item in report_domain.items],
            )

    @staticmethod
    def item_domain_to_orm(item_domain: GameProfileReportItem) -> GameProfileReportItemORM:
        if item_domain.is_persisted():
            return GameProfileReportItemORM(
                item_id=item_domain.item_id,
                videogame_id=item_domain.videogame_id,
                videogame_name=item_domain.videogame_name,
                icon_url=item_domain.icon_url,
                profile_count=item_domain.profile_count,
                percentage=item_domain.percentage,
                variation=item_domain.variation,
                variation_percentage=item_domain.variation_percentage,
                trend=item_domain.trend,
            )
        else:
            return GameProfileReportItemORM(
                videogame_id=item_domain.videogame_id,
                videogame_name=item_domain.videogame_name,
                icon_url=item_domain.icon_url,
                profile_count=item_domain.profile_count,
                percentage=item_domain.percentage,
                variation=item_domain.variation,
                variation_percentage=item_domain.variation_percentage,
                trend=item_domain.trend,
            )
