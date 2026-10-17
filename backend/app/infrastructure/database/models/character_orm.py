from sqlalchemy import ForeignKey, Boolean, Index, text
from sqlalchemy.sql import false
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
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false(), index=True)

    # Relaciones
    videogame: Mapped["VideogameORM"] = relationship(back_populates="characters")

    game_profile_associations: Mapped[list["CharacterPriorityORM"]] = relationship(
        "CharacterPriorityORM",
        back_populates="character",
        cascade="all, delete-orphan"
    )

    # Constraints
    __table_args__ = (
        Index(
            "uq_videogame_character_name",
            "videogame_id",
            "name",
            unique=True,
            sqlite_where=text("deleted = 0"),
            postgresql_where=text("deleted = false"),
        ),
    )