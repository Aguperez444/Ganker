from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.models.characterORM import CharacterORM
from app.infrastructure.database.models.game_profileORM import GameProfileORM
from app.infrastructure.database.models.rankORM import RankORM
from app.infrastructure.database.models.roleORM import RoleORM
from app.infrastructure.database.models.associations import (
    role_profile_characters
)

class RoleProfileORM:
    __tablename__ = "role_profiles"

    role_profile_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    game_profile_id: Mapped[int] = mapped_column(
        ForeignKey("game_profiles.profile_id"),
        nullable=False
    )

    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.role_id"),
        nullable=False
    )

    rank_id: Mapped[int] = mapped_column(
        ForeignKey("ranks.rank_id"),
        nullable=False
    )

    game_profile: Mapped["GameProfileORM"] = relationship(
        back_populates="role_profiles"
    )

    role: Mapped["RoleORM"] = relationship(
        back_populates="role_profiles"
    )

    rank: Mapped["RankORM"] = relationship(
        back_populates="role_profiles"
    )

    characters: Mapped[list["CharacterORM"]] = relationship(
        secondary=role_profile_characters,
        back_populates="role_profiles"
    )