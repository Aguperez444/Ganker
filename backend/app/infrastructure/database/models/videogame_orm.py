from typing import List
from sqlalchemy import String, Boolean, Index, text
from sqlalchemy.sql import true, false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.infrastructure.database.models.character_orm import CharacterORM
    from app.infrastructure.database.models.game_profile_orm import GameProfileORM
    from app.infrastructure.database.models.rank_orm import RankORM
    from app.infrastructure.database.models.role_orm import RoleORM
    from app.infrastructure.database.models.region_orm import RegionORM


class VideogameORM(Base):
    __tablename__ = "videogame"

    videogame_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    icon_url: Mapped[str] = mapped_column(String, nullable=False)
    rank_per_role: Mapped[bool] = mapped_column(Boolean, nullable=True)
    has_characters: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false(), index=True)

    __table_args__ = (
        Index(
            "uq_videogame_name_active",
            "name",
            unique=True,
            sqlite_where=text("deleted = 0"),
            postgresql_where=text("deleted = false"),
        ),
    )

    # Relaciones
    characters: Mapped[List["CharacterORM"]] = relationship(back_populates="videogame")
    ranks: Mapped[List["RankORM"]] = relationship(back_populates="videogame")
    roles: Mapped[List["RoleORM"]] = relationship(back_populates="videogame")
    game_profiles: Mapped[List["GameProfileORM"]] = relationship(back_populates="videogame")
    region: Mapped[List["RegionORM"]] = relationship(back_populates="videogame")
