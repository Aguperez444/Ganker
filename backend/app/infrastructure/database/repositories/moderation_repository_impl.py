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
            PlayerReportORM.status == ReportStatus.PENDING.value
        ).all()
        for report in reports:
            report.status = ReportStatus.RESOLVED.value
            report.resolved_at = datetime.now()
            report.resolved_by = admin_id

        self.session.flush()

    def unban_player(self, player_id: int) -> None:

        #Busco el registro de baneado
        register = self.session.query(UsersBanned).filter(
            UsersBanned.banned_user == player_id
        ).first()

        # Valido si el baneo expiró antes de desbanear al jugador
        if register:

            if not register.expires_at is None and register.expires_at < datetime.now():

                # Desactivo la flag de baneado en el usuario
                user = self.session.query(UserORM).filter(UserORM.user_id == player_id).first()
                user.banned = False

                self.session.flush()

            raise BanNotFinishedException()

    def manual_unban_player(self, player_id: int) -> None:
        #Busco el registro de baneado
        register = self.session.query(UsersBanned).filter(
            UsersBanned.banned_user == player_id
        ).first()

        if register:
            # Desactivo la flag de baneado en el usuario
            user = self.session.query(UserORM).filter(UserORM.user_id == player_id).first()
            user.banned = False

            # Marca el baneo como expirado
            register.expires_at = datetime.now()

            self.session.flush()
        else:
            raise NotBannedPlayerException()