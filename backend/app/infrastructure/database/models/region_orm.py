from typing import List
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.infrastructure.database.models.videogame_orm import VideogameORM
    from app.infrastructure.database.models.team_orm import TeamORM


class RegionORM(Base):
    __tablename__ = "region"

    region_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    videogame_id: Mapped[int] = mapped_column(ForeignKey("videogame.videogame_id"), nullable=False)

    # Relaciones
    videogame: Mapped["VideogameORM"] = relationship()
    teams: Mapped[List["TeamORM"]] = relationship(back_populates="region")
