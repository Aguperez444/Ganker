from typing import List, Optional
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base
from app.infrastructure.database.models.character_priority_orm import CharacterPriorityORM

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_orm import UserORM
    from app.infrastructure.database.models.videogame_orm import VideogameORM
    from app.infrastructure.database.models.role_profile_orm import RoleProfileORM
    from app.infrastructure.database.models.region_orm import RegionORM


class GameProfileORM(Base):
    __tablename__ = "game_profile"

    game_profile_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("user.user_id"), nullable=False)
    videogame_id: Mapped[int] = mapped_column(ForeignKey("videogame.videogame_id"), nullable=False)
    region_id: Mapped[Optional[int]] = mapped_column(ForeignKey("region.region_id"), nullable=True)

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

    # Constraints
    __table_args__ = (UniqueConstraint("player_id", "videogame_id", name="uq_profile_x_videogame"),)