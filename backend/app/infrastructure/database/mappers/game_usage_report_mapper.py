from app.domain.models.game_usage_report import GameUsageReport
from app.domain.models.game_usage_report_item import GameUsageReportItem
from app.infrastructure.database.models.game_usage_report_item_orm import GameUsageReportItemORM
from app.infrastructure.database.models.game_usage_report_orm import GameUsageReportORM


class GameUsageReportMapper:

    @staticmethod
    def orm_to_domain(report_orm: GameUsageReportORM) -> GameUsageReport:
        return GameUsageReport(
            report_id=report_orm.report_id,
            generated_by=report_orm.generated_by,
            analysis_type=report_orm.analysis_type,
            videogame_id=report_orm.videogame_id,
            videogame_name=report_orm.videogame_name,
            icon_url=report_orm.icon_url,
            generated_at=report_orm.generated_at,
            total=report_orm.total,
            items=[GameUsageReportMapper.item_orm_to_domain(item) for item in report_orm.items],
            start_date=report_orm.start_date,
            end_date=report_orm.end_date,
            previous_report_id=report_orm.previous_report_id,
        )

    @staticmethod
    def item_orm_to_domain(item_orm: GameUsageReportItemORM) -> GameUsageReportItem:
        return GameUsageReportItem(
            item_id=item_orm.item_id,
            category_id=item_orm.category_id,
            name=item_orm.name,
            icon_url=item_orm.icon_url,
            count=item_orm.count,
            percentage=item_orm.percentage,
            rank_range=item_orm.rank_range,
            variation=item_orm.variation,
            variation_percentage=item_orm.variation_percentage,
            trend=item_orm.trend,
        )

    @staticmethod
    def domain_to_orm(report_domain: GameUsageReport) -> GameUsageReportORM:
        if report_domain.is_persisted():
            return GameUsageReportORM(
                report_id=report_domain.report_id,
                generated_by=report_domain.generated_by,
                analysis_type=report_domain.analysis_type,
                videogame_id=report_domain.videogame_id,
                videogame_name=report_domain.videogame_name,
                icon_url=report_domain.icon_url,
                previous_report_id=report_domain.previous_report_id,
                start_date=report_domain.start_date,
                end_date=report_domain.end_date,
                generated_at=report_domain.generated_at,
                total=report_domain.total,
                items=[GameUsageReportMapper.item_domain_to_orm(item) for item in report_domain.items],
            )
        return GameUsageReportORM(
            generated_by=report_domain.generated_by,
            analysis_type=report_domain.analysis_type,
            videogame_id=report_domain.videogame_id,
            videogame_name=report_domain.videogame_name,
            icon_url=report_domain.icon_url,
            previous_report_id=report_domain.previous_report_id,
            start_date=report_domain.start_date,
            end_date=report_domain.end_date,
            generated_at=report_domain.generated_at,
            total=report_domain.total,
            items=[GameUsageReportMapper.item_domain_to_orm(item) for item in report_domain.items],
        )

    @staticmethod
    def item_domain_to_orm(item_domain: GameUsageReportItem) -> GameUsageReportItemORM:
        if item_domain.is_persisted():
            return GameUsageReportItemORM(
                item_id=item_domain.item_id,
                category_id=item_domain.category_id,
                name=item_domain.name,
                icon_url=item_domain.icon_url,
                count=item_domain.count,
                percentage=item_domain.percentage,
                rank_range=item_domain.rank_range,
                variation=item_domain.variation,
                variation_percentage=item_domain.variation_percentage,
                trend=item_domain.trend,
            )
        return GameUsageReportItemORM(
            category_id=item_domain.category_id,
            name=item_domain.name,
            icon_url=item_domain.icon_url,
            count=item_domain.count,
            percentage=item_domain.percentage,
            rank_range=item_domain.rank_range,
            variation=item_domain.variation,
            variation_percentage=item_domain.variation_percentage,
            trend=item_domain.trend,
        )
