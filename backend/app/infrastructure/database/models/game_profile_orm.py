from typing import List, Optional
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base
from app.infrastructure.database.models.associations import game_profile_x_characters

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.infrastructure.database.models.player_orm import PlayerORM
    from app.infrastructure.database.models.character_orm import CharacterORM
    from app.infrastructure.database.models.videogame_orm import VideogameORM
    from app.infrastructure.database.models.role_profile_orm import RoleProfileORM


class GameProfileORM(Base):
    __tablename__ = "game_profile"

    game_profile_id: Mapped[Optional[int]] = mapped_column(primary_key=True, autoincrement=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("player.player_id"), nullable=False)
    videogame_id: Mapped[int] = mapped_column(ForeignKey("videogame.videogame_id"), nullable=False)

    # Relaciones
    player: Mapped["PlayerORM"] = relationship(back_populates="game_profiles")
    videogame: Mapped["VideogameORM"] = relationship(back_populates="game_profiles")
    role_profiles: Mapped[List["RoleProfileORM"]] = relationship(back_populates="game_profile", cascade="all, delete-orphan")

    characters: Mapped[List["CharacterORM"]] = relationship(
        secondary=game_profile_x_characters,
        back_populates="game_profiles"
    )