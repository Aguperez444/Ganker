from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, text, Boolean, Index
from sqlalchemy.sql import false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base
from app.infrastructure.database.models.character_priority_orm import CharacterPriorityORM

from typing import TYPE_CHECKING


def _now_utc_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_orm import UserORM
    from app.infrastructure.database.models.videogame_orm import VideogameORM
    from app.infrastructure.database.models.role_profile_orm import RoleProfileORM
    from app.infrastructure.database.models.region_orm import RegionORM
    from app.infrastructure.database.models.riot_account_link_orm import RiotAccountLinkORM


class GameProfileORM(Base):
    __tablename__ = "game_profile"

    game_profile_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("user.user_id"), nullable=False)
    videogame_id: Mapped[int] = mapped_column(ForeignKey("videogame.videogame_id"), nullable=False)
    region_id: Mapped[Optional[int]] = mapped_column(ForeignKey("region.region_id"), nullable=True)
    in_game_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=_now_utc_naive, server_default=text("CURRENT_TIMESTAMP")
    )
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false(), index=True)

    # Relaciones
    user: Mapped["UserORM"] = relationship(back_populates="game_profiles")
    videogame: Mapped["VideogameORM"] = relationship(back_populates="game_profiles")
    role_profiles: Mapped[List["RoleProfileORM"]] = relationship(back_populates="game_profile", cascade="all, delete-orphan")
    region: Mapped[Optional["RegionORM"]] = relationship(back_populates="game_profiles")

    character_associations: Mapped[List["CharacterPriorityORM"]] = relationship(
        back_populates="game_profile",
        cascade="all, delete-orphan",
        order_by="CharacterPriorityORM.priority"
    )

    # Cuenta de Riot vinculada (solo perfiles de League of Legends); se borra junto con el perfil
    riot_account_link: Mapped[Optional["RiotAccountLinkORM"]] = relationship(
        back_populates="game_profile",
        cascade="all, delete-orphan",
        uselist=False
    )

    # Constraints
    __table_args__ = (
        Index(
            "uq_profile_x_videogame",
            "player_id",
            "videogame_id",
            unique=True,
            sqlite_where=text("deleted = 0"),
            postgresql_where=text("deleted = false"),
        ),
    )