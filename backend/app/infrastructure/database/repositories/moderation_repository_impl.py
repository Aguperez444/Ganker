from datetime import datetime, timedelta, timezone
from math import ceil

from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload

from app.application.ports.i_moderation_repository import IModerationRepository

from app.infrastructure.database.mappers.player_report_mapper import PlayerReportMapper
from app.infrastructure.database.mappers.user_ban_record_mapper import UserBanRecordMapper

from app.infrastructure.database.models import UserORM
from app.infrastructure.database.models import PlayerReportORM

from app.domain.exceptions.moderation.ban_not_finished_exception import BanNotFinishedException
from app.domain.exceptions.moderation.report_cooldown_exception import ReportCooldownException
from app.domain.exceptions.moderation.not_banned_player_exception import NotBannedPlayerException

from app.infrastructure.database.models.user_ban_record_orm import UserBanRecordORM

from app.domain.models.report_status import ReportStatus
from app.domain.models.ban_lifecycle import BanEndReason, utc_datetime

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.domain.models.player_report import PlayerReport
    from app.domain.models.user_ban_record import UserBanRecord



class ModerationRepositoryImpl(IModerationRepository):
    def __init__(self, session):
        self.session = session

    def get_active_bans(self, username: str | None,skip: int,
                        limit: int,) -> list[tuple[int, str, str, datetime | None]]:
        # Seleccionar primero el último registro evita revivir un baneo anterior.
        latest_bans = self.session.query(
            UserBanRecordORM.banned_user_id,
            func.max(UserBanRecordORM.id).label("latest_id"),
        ).group_by(UserBanRecordORM.banned_user_id).subquery()
        query = self.session.query(
            UserORM.user_id, UserORM.username,
            UserBanRecordORM.reason, UserBanRecordORM.expires_at,
        ).join(
            UserBanRecordORM, UserBanRecordORM.banned_user_id == UserORM.user_id,
        ).join(
            latest_bans, UserBanRecordORM.id == latest_bans.c.latest_id,
        ).filter(
            UserORM.banned.is_(True),
            UserORM.deleted.is_(False),
            UserBanRecordORM.ended_at.is_(None),
            or_(
                UserBanRecordORM.expires_at.is_(None),
                UserBanRecordORM.expires_at > datetime.now(timezone.utc),
            ),
        )
        if username:
            query = query.filter(UserORM.username.icontains(username, autoescape=True))

        found_rows = query.order_by(UserORM.user_id).offset(skip).limit(limit).all()
        return [tuple(row) for row in found_rows]

    def report_player(self, report: 'PlayerReport', cooldown: timedelta) -> 'PlayerReport':
        # La fila del denunciante existe incluso antes de su primer reporte.
        # PostgreSQL mantiene el bloqueo hasta el commit/rollback del UoW, evitando
        # que dos peticiones simultáneas comprueben el plazo y se guarden a la vez.
        self.session.query(UserORM.user_id).filter(
            UserORM.user_id == report.reporter.user_id,
        ).with_for_update().one()
        latest_report = self.session.query(PlayerReportORM.created_at).filter(
            PlayerReportORM.reporter_id == report.reporter.user_id,
            PlayerReportORM.reported_id == report.reported.user_id,
        ).order_by(PlayerReportORM.created_at.desc(), PlayerReportORM.id.desc()).first()
        now = datetime.now(timezone.utc)
        if latest_report is not None:
            # SQLite descarta la zona horaria; los reportes se generan en UTC.
            last_created = latest_report.created_at
            if last_created.tzinfo is None:
                last_created = last_created.replace(tzinfo=timezone.utc)
            retry_at = last_created + cooldown
            if now < retry_at:
                raise ReportCooldownException(
                    retry_after=ceil((retry_at - now).total_seconds()), retry_at=retry_at,
                )
        report.created_at = now
        report_orm = PlayerReportMapper.domain_to_orm(report)
        self.session.add(report_orm)
        self.session.flush()
        self.session.refresh(report_orm)
        return PlayerReportMapper.orm_to_domain(report_orm)

    def ban_user(self, ban_record: UserBanRecord) -> None:
        ban_record_orm = UserBanRecordMapper.domain_to_orm(ban_record)  # Convertir a ORM

        #Activo los flags de baneado en el usuario
        banned_user_id = ban_record.banned_user.user_id

        # esto revisa el historial de baneos y actualiza el registro anterior si es necesario
        # puede que dos admins baneen al mismo jugador, entonces se toma él ban más reciente y se cierra el anterior
        # marcándolo con el estado de "superseded".

        user = self.session.query(UserORM).filter(UserORM.user_id == banned_user_id).with_for_update().populate_existing().first()

        previous = self.session.query(UserBanRecordORM).filter(
            UserBanRecordORM.banned_user_id == banned_user_id,
        ).order_by(UserBanRecordORM.id.desc()).first()
        if previous and previous.ended_at is None and user.banned:
            if previous.expires_at is not None and utc_datetime(previous.expires_at) <= datetime.now(timezone.utc):
                previous.ended_at = previous.expires_at
                previous.end_reason = BanEndReason.EXPIRED.value
            else:
                previous.ended_at = datetime.now(timezone.utc)
                previous.ended_by_user_id = ban_record.banned_by_user.user_id
                previous.end_reason = BanEndReason.SUPERSEDED.value

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
            report.resolved_at = datetime.now(timezone.utc)
            report.resolver_id = ban_record.banned_by_user.user_id

        self.session.flush()

    def unban_user_if_applicable(self, user_id: int) -> None:
        user = self.session.query(UserORM).filter(UserORM.user_id == user_id).with_for_update().populate_existing().first()

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

            if user_ban_log.ended_at is not None:
                if user:
                    user.banned = False
                self.session.flush()
                return

            if user_ban_log.expires_at is not None:
                expires_at = user_ban_log.expires_at
                # SQLite descarta la zona horaria; los baneos se generan en UTC.
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at <= datetime.now(timezone.utc):
                    # Desactivo el flag de baneado en el usuario
                    if user:
                        user.banned = False
                    user_ban_log.ended_at = user_ban_log.expires_at
                    user_ban_log.end_reason = BanEndReason.EXPIRED.value
                    self.session.flush()
                    return

            raise BanNotFinishedException(
                reason=user_ban_log.reason, expires_at=user_ban_log.expires_at,
                user_id=user_id, ban_id=user_ban_log.id,
            )

        if user and getattr(user, "banned", False) is True:
            raise BanNotFinishedException()

    def manual_unban_user(self, user_id: int, admin_id: int | None = None, source: str = "manual") -> None:
        user = self.session.query(UserORM).filter(UserORM.user_id == user_id).with_for_update().populate_existing().first()
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

            # Conserva el vencimiento pactado y registra el cierre por separado.
            if register.expires_at is not None and utc_datetime(register.expires_at) <= datetime.now(timezone.utc):
                register.ended_at = register.expires_at
                register.end_reason = BanEndReason.EXPIRED.value
                register.ended_by_user_id = None
            else:
                register.ended_at = datetime.now(timezone.utc)
                register.ended_by_user_id = admin_id
                register.end_reason = source

            self.session.flush()
        elif user and getattr(user, "banned", False) is True:
            user.banned = False
            self.session.flush()
        else:
            raise NotBannedPlayerException()

    def _ban_records_query(self):
        return self.session.query(UserBanRecordORM).options(
            joinedload(UserBanRecordORM.banned_user),
            joinedload(UserBanRecordORM.banned_by_user),
            joinedload(UserBanRecordORM.ended_by_user),
        ).filter(UserBanRecordORM.banned_user.has(UserORM.deleted.is_(False)))

    def get_ban_record(self, ban_id: int):
        record = self._ban_records_query().filter(UserBanRecordORM.id == ban_id).first()
        if record is None:
            return None
        latest = self.session.query(func.max(UserBanRecordORM.id)).filter(
            UserBanRecordORM.banned_user_id == record.banned_user_id,
        ).scalar()
        return UserBanRecordMapper.orm_to_domain(record), record.id == latest

    def get_player_ban_history(self, user_id: int, before_ban_id: int | None, skip: int, limit: int):
        query = self._ban_records_query().filter(UserBanRecordORM.banned_user_id == user_id)
        if before_ban_id is not None:
            query = query.filter(UserBanRecordORM.id < before_ban_id)
        latest = self.session.query(func.max(UserBanRecordORM.id)).filter(
            UserBanRecordORM.banned_user_id == user_id,
        ).scalar()
        rows = query.order_by(UserBanRecordORM.id.desc()).offset(skip).limit(limit).all()
        return [(UserBanRecordMapper.orm_to_domain(row), row.id == latest) for row in rows]

    def get_report_for_resolution(self, report_id: int):
        target_id = self.session.query(PlayerReportORM.reported_id).filter(PlayerReportORM.id == report_id).scalar()
        if target_id is None:
            return None
        # Mismo orden de bloqueo que ban_user: jugador y después denuncia.
        user = self.session.query(UserORM).filter(
            UserORM.user_id == target_id, UserORM.deleted.is_(False),
        ).with_for_update().populate_existing().first()
        if user is None:
            return None
        row = self.session.query(PlayerReportORM).filter(
            PlayerReportORM.id == report_id,
        ).with_for_update().populate_existing().first()
        return PlayerReportMapper.orm_to_domain(row) if row else None

    def dismiss_report(self, report: 'PlayerReport') -> None:
        row = self.session.get(PlayerReportORM, report.report_id)
        row.status = report.status
        row.resolved_at = report.resolved_at
        row.resolver_id = report.resolver_user.user_id
        self.session.flush()

    def _player_reports_query(self):
        return self.session.query(PlayerReportORM).options(
            joinedload(PlayerReportORM.reporter), joinedload(PlayerReportORM.reported),
            joinedload(PlayerReportORM.resolver_user),
            joinedload(PlayerReportORM.videogame),
        ).filter(
            PlayerReportORM.reporter.has(UserORM.deleted.is_(False)),
            PlayerReportORM.reported.has(UserORM.deleted.is_(False)),
        )

    def get_player_report(self, report_id: int):
        row = self._player_reports_query().filter(PlayerReportORM.id == report_id).first()
        return PlayerReportMapper.orm_to_domain(row) if row else None

    def get_cross_reports(self, reporter_id, reported_id, start, end, skip, limit):
        rows = self._player_reports_query().filter(
            PlayerReportORM.reporter_id == reporter_id,
            PlayerReportORM.reported_id == reported_id,
            PlayerReportORM.created_at >= start,
            PlayerReportORM.created_at <= end,
        ).order_by(PlayerReportORM.created_at, PlayerReportORM.id).offset(skip).limit(limit).all()
        return [PlayerReportMapper.orm_to_domain(row) for row in rows]
