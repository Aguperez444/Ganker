from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.characterORM import CharacterORM
from app.infrastructure.database.models.playerORM import PlayerORM
from app.infrastructure.database.models.rankORM import RankORM
from app.infrastructure.database.models.roleORM import RoleORM
from app.infrastructure.database.models.role_profileORM import RoleProfileORM
from app.infrastructure.database.models.videogameORM import VideogameORM

from app.infrastructure.database.models.associations import (
    game_profile_roles,
    game_profile_characters,
)

class GameProfileORM:
    __tablename__ = "game_profile"

    profile_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    player_id: Mapped[int] = mapped_column(Integer, ForeignKey("players.player_id"), nullable=False)
    videogame_id: Mapped[int] = mapped_column(Integer, ForeignKey("videogames.videogame_id"), nullable=False)
    rank_id: Mapped[int] = mapped_column(Integer, ForeignKey("rank.rank_id"), nullable=True)

    player: Mapped["PlayerORM"] = relationship(
        back_populates="game_profiles"
    )

    videogame: Mapped["VideogameORM"] = relationship(
        back_populates="game_profiles"
    )

    rank: Mapped["RankORM | None"] = relationship(
        back_populates="game_profiles"
    )

    roles: Mapped[list["RoleORM"]] = relationship(
        secondary=game_profile_roles,
        back_populates="game_profiles"
    )

    characters: Mapped[list["CharacterORM"]] = relationship(
        secondary=game_profile_characters,
        back_populates="game_profiles"
    )

    role_profiles: Mapped[list["RoleProfileORM"]] = relationship(
        back_populates="game_profile",
        cascade="all, delete-orphan"
    )
