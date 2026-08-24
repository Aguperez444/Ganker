from typing import List
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.infrastructure.database.models.character_orm import CharacterORM
    from app.infrastructure.database.models.game_profile_orm import GameProfileORM
    from app.infrastructure.database.models.rank_orm import RankORM
    from app.infrastructure.database.models.role_orm import RoleORM


class VideogameORM(Base):
    __tablename__ = "videogame"

    videogame_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    # Relaciones
    characters: Mapped[List["CharacterORM"]] = relationship(back_populates="videogame")
    ranks: Mapped[List["RankORM"]] = relationship(back_populates="videogame")
    roles: Mapped[List["RoleORM"]] = relationship(back_populates="videogame")
    game_profiles: Mapped[List["GameProfileORM"]] = relationship(back_populates="videogame")