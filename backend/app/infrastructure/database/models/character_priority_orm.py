from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.game_profile_orm import GameProfileORM
    from app.infrastructure.database.models.character_orm import CharacterORM


class CharacterPriorityORM(Base):
    __tablename__ = "game_profile_character_priority"
    __table_args__ = (
        UniqueConstraint("game_profile_id", "priority", name="uq_game_profile_preference"),
        UniqueConstraint("game_profile_id", "character_id", name="uq_game_profile_character"),
    )

    character_priority_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    game_profile_id: Mapped[int] = mapped_column(ForeignKey("game_profile.game_profile_id"), nullable=False)
    character_id: Mapped[int] = mapped_column(ForeignKey("character.character_id"), nullable=False)
    priority: Mapped[int] = mapped_column(nullable=False)

    # Relaciones
    game_profile: Mapped["GameProfileORM"] = relationship(back_populates="character_associations")
    character: Mapped["CharacterORM"] = relationship(back_populates="game_profile_associations")