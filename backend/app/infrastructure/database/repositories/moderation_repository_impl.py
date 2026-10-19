from datetime import datetime

from sqlalchemy.sql.functions import now

from app.application.ports.i_moderation_repository import IModerationRepository
from app.domain.exceptions.moderation.ban_not_finished_exception import BanNotFinishedException
from app.domain.exceptions.moderation.not_banned_player_exception import NotBannedPlayerException
from app.infrastructure.database.models import UserORM
from app.infrastructure.database.models.player_report_orm import PlayerReportORM, ReportStatus
from app.infrastructure.database.models.users_banned import UsersBanned


class ModerationRepositoryImpl(IModerationRepository):
    def __init__(self, session):
        self.session = session

    def report_player(self, report: PlayerReportORM) -> PlayerReportORM:
        self.session.add(report)
        self.session.flush()
        return report

    def ban_player(self, player_id: int, admin_id: int, register: UsersBanned) -> None:
        #Activo la flag de baneado en el usuario
        user = self.session.query(UserORM).filter(UserORM.user_id == player_id).first()
        user.banned = True
        #Lo agrego a la tabla de baneados
        self.session.add(register)

        #Busco todos los reportes del jugador y los marco como resueltos
        reports = self.session.query(PlayerReportORM).filter(
            PlayerReportORM.reported_id == player_id,
            PlayerReportORM.status == ReportStatus.PENDING
        ).all()
        for report in reports:
            report.status = ReportStatus.RESOLVED
            report.resolved_at = datetime.now()
            report.resolved_by = admin_id

        self.session.flush()

    def unban_player(self, player_id: int) -> None:
        user = self.session.query(UserORM).filter(UserORM.user_id == player_id).first()

        #Busco el registro de baneado más reciente
        register = (
            self.session.query(UsersBanned)
            .filter(UsersBanned.banned_user == player_id)
            .order_by(UsersBanned.id.desc())
            .first()
        )

        # Valido si el baneo expiró antes de desbanear al jugador
        if register:
            if user and getattr(user, "banned", False) is False:
                return

            if register.expires_at is not None:
                now_dt = datetime.now(register.expires_at.tzinfo) if register.expires_at.tzinfo else datetime.now()
                if register.expires_at <= now_dt:
                    # Desactivo la flag de baneado en el usuario
                    if user:
                        user.banned = False
                    self.session.flush()
                    return

            raise BanNotFinishedException()

        if user and getattr(user, "banned", False) is True:
            raise BanNotFinishedException()

    def manual_unban_player(self, player_id: int) -> None:
        user = self.session.query(UserORM).filter(UserORM.user_id == player_id).first()
        #Busco el registro de baneado más reciente
        register = (
            self.session.query(UsersBanned)
            .filter(UsersBanned.banned_user == player_id)
            .order_by(UsersBanned.id.desc())
            .first()
        )

        if register and (user is None or getattr(user, "banned", False) is True):
            # Desactivo la flag de baneado en el usuario
            if user:
                user.banned = False

            # Marca el baneo como expirado
            register.expires_at = datetime.now()

            self.session.flush()
        elif user and getattr(user, "banned", False) is True:
            user.banned = False
            self.session.flush()
        else:
            raise NotBannedPlayerException()