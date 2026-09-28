from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base
if TYPE_CHECKING:
    from app.infrastructure.database.models.videogame_orm import VideogameORM
    from app.infrastructure.database.models.game_profile_orm import GameProfileORM


class RegionORM(Base):
    __tablename__ = "region"

    region_id: Mapped[int] = mapped_column(primery_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    videogame_id: Mapped[int] = mapped_column(ForeignKey("videogame.videgame.id"), nullable=False)

    # Relaciones
    videogame: Mapped["VideogameORM"] = relationship(back_populates="regions")
    game_profiles: Mapped["GameProfileORM"] = relationship(back_populates="region")