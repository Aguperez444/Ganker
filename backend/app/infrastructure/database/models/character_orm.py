from typing import List
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base
from app.infrastructure.database.models.associations import game_profile_x_characters

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.infrastructure.database.models.game_profile_orm import GameProfileORM
    from app.infrastructure.database.models.videogame_orm import VideogameORM


class CharacterORM(Base):
    __tablename__ = "character"

    character_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    videogame_id: Mapped[int] = mapped_column(ForeignKey("videogame.videogame_id"), nullable=False)
    name: Mapped[str] = mapped_column(nullable=False)

    # Relaciones
    videogame: Mapped["VideogameORM"] = relationship(back_populates="characters")
    game_profiles: Mapped[List["GameProfileORM"]] = relationship(
        secondary=game_profile_x_characters,
        back_populates="characters"
    )