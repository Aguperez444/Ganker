from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, ForeignKey
from app.infrastructure.database.base import Base
from app.infrastructure.database.models.game_profileORM import GameProfileORM
from app.infrastructure.database.models.role_profileORM import RoleProfileORM
from app.infrastructure.database.models.videogameORM import VideogameORM


class RankORM(Base):

    __tablename__ = 'rank'

    rank_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    value: Mapped[int] = mapped_column(Integer, nullable=False)

    name: Mapped[str] = mapped_column(String, nullable=False)

    videogame_id: Mapped[int] = mapped_column(Integer, ForeignKey("videogames.videogame_id"), nullable=False)

    videogame: Mapped["VideogameORM"] = relationship(
        back_populates="ranks"
    )

    game_profiles: Mapped[list["GameProfileORM"]] = relationship(
        back_populates="rank"
    )

    role_profiles: Mapped[list["RoleProfileORM"]] = relationship(
        back_populates="rank"
    )