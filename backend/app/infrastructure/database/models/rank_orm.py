from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.infrastructure.database.models.role_profile_orm import RoleProfileORM
    from app.infrastructure.database.models.videogame_orm import VideogameORM


class RankORM(Base):
    __tablename__ = "rank"

    rank_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    videogame_id: Mapped[int] = mapped_column(ForeignKey("videogame.videogame_id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[int] = mapped_column(nullable=False)
    icon_url: Mapped[str] = mapped_column(String, nullable=False)

    # Relaciones
    videogame: Mapped["VideogameORM"] = relationship(back_populates="ranks")
    role_profiles: Mapped[list["RoleProfileORM"]] = relationship(back_populates="rank")

    # Constraints
    __table_args__ = (
        UniqueConstraint("videogame_id", "name", name="uq_videogame_rank_name"),
        UniqueConstraint("videogame_id", "value", name="uq_videogame_rank_value"),
    )