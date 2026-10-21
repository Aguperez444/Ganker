from typing import List, Optional
from sqlalchemy import String, DateTime, Boolean, Index, text
from sqlalchemy.sql import false
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING

from app.infrastructure.database.models.password_reset_token_orm import PasswordResetTokenORM
from app.infrastructure.database.models.player_report_orm import PlayerReportORM
from app.infrastructure.database.models.user_ban_record_orm import UserBanRecordORM

if TYPE_CHECKING:
    from app.infrastructure.database.models.game_profile_orm import GameProfileORM
    from app.infrastructure.database.models.refresh_token_orm import RefreshTokenORM
    from app.infrastructure.database.models.conversation_member_orm import ConversationMemberORM
    from app.infrastructure.database.models.message_orm import MessageORM
    from app.infrastructure.database.models.discord_account_link_orm import DiscordAccountLinkORM
    from app.infrastructure.database.models.federated_identity_orm import FederatedIdentityORM


class UserORM(Base):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    username: Mapped[str] = mapped_column(String, nullable=False)
    mail: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, nullable=False, default="player")
    icon_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    last_connection: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false(), index=True)
    banned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())

    __table_args__ = (
        Index(
            "uq_user_username_active",
            "username",
            unique=True,
            sqlite_where=text("deleted = 0"),
            postgresql_where=text("deleted = false"),
        ),
        Index(
            "uq_user_mail_active",
            "mail",
            unique=True,
            sqlite_where=text("deleted = 0"),
            postgresql_where=text("deleted = false"),
        )
    )


    # Relaciones
    game_profiles: Mapped[List["GameProfileORM"]] = relationship(back_populates="user")
    refresh_tokens: Mapped[List["RefreshTokenORM"]] = relationship(back_populates="user")
    conversation_memberships: Mapped[List["ConversationMemberORM"]] = relationship(
        "ConversationMemberORM",
        back_populates="user"
    )
    sent_messages: Mapped[List["MessageORM"]] = relationship(
        "MessageORM",
        back_populates="sender"
    )
    password_reset_tokens: Mapped[List["PasswordResetTokenORM"]] = relationship(
        "PasswordResetTokenORM",
        back_populates="user",
        cascade="all, delete, delete-orphan"
    )
    # Cuenta de Discord vinculada (opcional); se borra junto con el usuario
    discord_account_link: Mapped[Optional["DiscordAccountLinkORM"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False
    )
    # Identidades federadas para inicio de sesión (Discord, Steam, Twitch, Google)
    federated_identities: Mapped[List["FederatedIdentityORM"]] = relationship(
        "FederatedIdentityORM",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    # Reportes de jugadores
    reporter_player: Mapped[List["PlayerReportORM"]] = relationship(
        "PlayerReportORM",
        foreign_keys="[PlayerReportORM.reporter_id]",
        back_populates="reporter",
        cascade="all, delete-orphan"
    )
    reported_player: Mapped[List["PlayerReportORM"]] = relationship(
        "PlayerReportORM",
        foreign_keys="[PlayerReportORM.reported_id]",
        back_populates="reported",
        cascade="all, delete-orphan"
    )
    resolver_player: Mapped[List["PlayerReportORM"]] = relationship(
        "PlayerReportORM",
        foreign_keys="[PlayerReportORM.resolver_id]",
        back_populates="resolver_user",
        cascade="all, delete-orphan"
    )
    banned_player: Mapped[List["UserBanRecordORM"]] = relationship(
        "UserBanRecordORM",
        foreign_keys="[UserBanRecordORM.banned_user_id]",
        back_populates="banned_user",
        cascade="all, delete-orphan"
    )
    moderator_banned_player: Mapped[List["UserBanRecordORM"]] = relationship(
        "UserBanRecordORM",
        foreign_keys="[UserBanRecordORM.banned_by_user_id]",
        back_populates="banned_by_user",
        cascade="all, delete-orphan"
    )

