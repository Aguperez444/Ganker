from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base
from typing import TYPE_CHECKING

from app.infrastructure.database.models.character_priority_orm import CharacterPriorityORM

if TYPE_CHECKING:
    from app.infrastructure.database.models.videogame_orm import VideogameORM


class CharacterORM(Base):
    __tablename__ = "character"

    character_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    videogame_id: Mapped[int] = mapped_column(ForeignKey("videogame.videogame_id"), nullable=False)
    name: Mapped[str] = mapped_column(nullable=False)
    icon_url: Mapped[str] = mapped_column(nullable=False)

    # Relaciones
    videogame: Mapped["VideogameORM"] = relationship(back_populates="characters")

    game_profile_associations: Mapped[list["CharacterPriorityORM"]] = relationship(
        "CharacterPriorityORM",
        back_populates="character",
        cascade="all, delete-orphan"
    )

    # Constraints
    __table_args__ = (UniqueConstraint("videogame_id", "name", name="uq_videogame_character_name"),)