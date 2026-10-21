from typing import Optional, TYPE_CHECKING

from sqlalchemy.orm import Session, selectinload

from app.application.ports.i_game_profile_report_repository import IGameProfileReportRepository
from app.infrastructure.database.mappers.game_profile_report_mapper import GameProfileReportMapper
from app.infrastructure.database.models.game_profile_report_orm import GameProfileReportORM

if TYPE_CHECKING:
    from app.domain.models.game_profile_report import GameProfileReport


class GameProfileReportRepositoryImpl(IGameProfileReportRepository):

    def __init__(self, session: Session):
        self._session: Session = session

    def create_report(self, report: 'GameProfileReport') -> 'GameProfileReport':
        orm_report = GameProfileReportMapper.domain_to_orm(report)
        self._session.add(orm_report)
        self._session.flush()  # para obtener el report_id generado
        return GameProfileReportMapper.orm_to_domain(orm_report)

    def get_report_by_id(self, report_id: int) -> Optional['GameProfileReport']:
        found = self._session.query(GameProfileReportORM).options(selectinload(GameProfileReportORM.items)).filter(
            GameProfileReportORM.report_id == report_id
        ).first()
        return GameProfileReportMapper.orm_to_domain(found) if found else None

    def get_latest_report(self) -> Optional['GameProfileReport']:
        found = self._session.query(GameProfileReportORM).options(selectinload(GameProfileReportORM.items)).order_by(
            GameProfileReportORM.generated_at.desc(),
            GameProfileReportORM.report_id.desc()
        ).first()
        return GameProfileReportMapper.orm_to_domain(found) if found else None

    def get_all_reports(self) -> list['GameProfileReport']:
        found = self._session.query(GameProfileReportORM).options(selectinload(GameProfileReportORM.items)).order_by(
            GameProfileReportORM.generated_at.desc(),
            GameProfileReportORM.report_id.desc()
        ).all()
        return [GameProfileReportMapper.orm_to_domain(report) for report in found]
