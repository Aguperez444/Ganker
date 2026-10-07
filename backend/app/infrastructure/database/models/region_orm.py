from typing import TYPE_CHECKING, List

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base
if TYPE_CHECKING:
    from app.infrastructure.database.models.videogame_orm import VideogameORM
    from app.infrastructure.database.models.game_profile_orm import GameProfileORM
    from app.infrastructure.database.models.team_orm import TeamORM


class RegionORM(Base):
    __tablename__ = "region"

    region_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    videogame_id: Mapped[int] = mapped_column(ForeignKey("videogame.videogame_id"), nullable=False)

    # Relaciones
    videogame: Mapped["VideogameORM"] = relationship(back_populates="region")
    game_profiles: Mapped[List["GameProfileORM"]] = relationship(back_populates="region")
    teams: Mapped[List["TeamORM"]] = relationship(back_populates="region")
