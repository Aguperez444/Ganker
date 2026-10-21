from datetime import datetime

from app.application.ports.i_moderation_repository import IModerationRepository

from app.infrastructure.database.mappers.player_report_mapper import PlayerReportMapper
from app.infrastructure.database.mappers.user_ban_record_mapper import UserBanRecordMapper

from app.infrastructure.database.models import UserORM
from app.infrastructure.database.models import PlayerReportORM

from app.domain.exceptions.moderation.ban_not_finished_exception import BanNotFinishedException
from app.domain.exceptions.moderation.not_banned_player_exception import NotBannedPlayerException

from app.infrastructure.database.models.user_ban_record_orm import UserBanRecordORM

from app.domain.models.player_report import ReportStatus
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.domain.models.player_report import PlayerReport
    from app.domain.models.user_ban_record import UserBanRecord



class ModerationRepositoryImpl(IModerationRepository):
    def __init__(self, session):
        self.session = session

    def report_player(self, report: 'PlayerReport') -> 'PlayerReport':
        report_orm = PlayerReportMapper.domain_to_orm(report)
        self.session.add(report_orm)
        self.session.flush()
        self.session.refresh(report_orm)
        return PlayerReportMapper.orm_to_domain(report_orm)

    def ban_user(self, ban_record: UserBanRecord) -> None:
        ban_record_orm = UserBanRecordMapper.domain_to_orm(ban_record)  # Convertir a ORM

        #Activo los flags de baneado en el usuario
        banned_user_id = ban_record.banned_user.user_id
        user = self.session.query(UserORM).filter(UserORM.user_id == banned_user_id).first()

        # esto se persiste al finalizar la transacción, no es necesario hacer flush acá
        user.banned = True
        #Lo agrego a la tabla de baneados
        self.session.add(ban_record_orm)

        #Busco todos los reportes del jugador y los marco como resueltos, indico quien los resolvió y la fecha de resolución
        reports = self.session.query(PlayerReportORM).filter(
            PlayerReportORM.reported_id == banned_user_id,
            PlayerReportORM.status == ReportStatus.PENDING
        ).all()
        for report in reports:
            report.status = ReportStatus.RESOLVED
            report.resolved_at = datetime.now()
            report.resolver_id = ban_record.banned_by_user.user_id

        self.session.flush()

    def unban_user_if_applicable(self, user_id: int) -> None:
        user = self.session.query(UserORM).filter(UserORM.user_id == user_id).first()

        #Busco el registro de baneado más reciente
        user_ban_log = (
            self.session.query(UserBanRecordORM)
            .filter(UserBanRecordORM.banned_user_id == user_id)
            .order_by(UserBanRecordORM.id.desc())
            .first()
        )

        # Válido si él ban expiró antes de desbanear al jugador
        if user_ban_log:
            if user and getattr(user, "banned", False) is False:
                return

            if user_ban_log.expires_at is not None:
                now_dt = datetime.now(user_ban_log.expires_at.tzinfo) if user_ban_log.expires_at.tzinfo else datetime.now()
                if user_ban_log.expires_at <= now_dt:
                    # Desactivo el flag de baneado en el usuario
                    if user:
                        user.banned = False
                    self.session.flush()
                    return

            raise BanNotFinishedException()

        if user and getattr(user, "banned", False) is True:
            raise BanNotFinishedException()

    def manual_unban_user(self, user_id: int) -> None:
        user = self.session.query(UserORM).filter(UserORM.user_id == user_id).first()
        #Busco el registro de baneado más reciente
        register = (
            self.session.query(UserBanRecordORM)
            .filter(UserBanRecordORM.banned_user_id == user_id)
            .order_by(UserBanRecordORM.id.desc())
            .first()
        )

        if register and (user is None or getattr(user, "banned", False) is True):
            # Desactivo el flag de baneado en el usuario
            if user:
                user.banned = False

            # Marca él ban como expirado
            register.expires_at = datetime.now()

            self.session.flush()
        elif user and getattr(user, "banned", False) is True:
            user.banned = False
            self.session.flush()
        else:
            raise NotBannedPlayerException()