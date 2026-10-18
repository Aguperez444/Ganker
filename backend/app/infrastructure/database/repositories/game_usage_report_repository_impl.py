from typing import Optional, TYPE_CHECKING

from sqlalchemy.orm import Session, selectinload

from app.application.ports.i_game_usage_report_repository import IGameUsageReportRepository
from app.infrastructure.database.mappers.game_usage_report_mapper import GameUsageReportMapper
from app.infrastructure.database.models.game_usage_report_orm import GameUsageReportORM

if TYPE_CHECKING:
    from app.domain.models.game_usage_report import GameUsageReport


class GameUsageReportRepositoryImpl(IGameUsageReportRepository):

    def __init__(self, session: Session):
        self._session: Session = session

    def create_report(self, report: 'GameUsageReport') -> 'GameUsageReport':
        orm_report = GameUsageReportMapper.domain_to_orm(report)
        self._session.add(orm_report)
        self._session.flush()  # para obtener el report_id generado
        return GameUsageReportMapper.orm_to_domain(orm_report)

    def get_report_by_id(self, report_id: int) -> Optional['GameUsageReport']:
        found = self._session.query(GameUsageReportORM).options(selectinload(GameUsageReportORM.items)).filter(
            GameUsageReportORM.report_id == report_id
        ).first()
        return GameUsageReportMapper.orm_to_domain(found) if found else None

    def get_latest_report(self, videogame_id: Optional[int], analysis_type: str) -> Optional['GameUsageReport']:
        found = self._session.query(GameUsageReportORM).options(selectinload(GameUsageReportORM.items)).filter(
            GameUsageReportORM.videogame_id == videogame_id,
            GameUsageReportORM.analysis_type == analysis_type,
        ).order_by(
            GameUsageReportORM.generated_at.desc(),
            GameUsageReportORM.report_id.desc()
        ).first()
        return GameUsageReportMapper.orm_to_domain(found) if found else None

    def get_all_reports(
        self,
        videogame_id: Optional[int] = None,
        analysis_type: Optional[str] = None,
        general_only: bool = False,
    ) -> list['GameUsageReport']:
        query = self._session.query(GameUsageReportORM).options(selectinload(GameUsageReportORM.items))
        if videogame_id is not None:
            query = query.filter(GameUsageReportORM.videogame_id == videogame_id)
        if analysis_type is not None:
            query = query.filter(GameUsageReportORM.analysis_type == analysis_type)
        if general_only:
            query = query.filter(GameUsageReportORM.videogame_id.is_(None))
        found = query.order_by(
            GameUsageReportORM.generated_at.desc(),
            GameUsageReportORM.report_id.desc()
        ).all()
        return [GameUsageReportMapper.orm_to_domain(report) for report in found]
