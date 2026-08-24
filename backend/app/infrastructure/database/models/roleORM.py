from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, ForeignKey
from app.infrastructure.database.base import Base
from app.infrastructure.database.models.characterORM import CharacterORM
from app.infrastructure.database.models.game_profileORM import GameProfileORM
from app.infrastructure.database.models.role_profileORM import RoleProfileORM
from app.infrastructure.database.models.videogameORM import VideogameORM

from app.infrastructure.database.models.associations import (
    game_profile_roles,
    character_roles,
)

class RoleORM(Base):

    __tablename__ = "role"

    role_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String(50), nullable=False)

    videogame_id: Mapped[int] = mapped_column(Integer, ForeignKey("videogames.videogame_id"), nullable=False)

    videogame: Mapped["VideogameORM"] = relationship(
        back_populates="roles"
    )

    characters: Mapped[list["CharacterORM"]] = relationship(
        secondary=character_roles,
        back_populates="roles"
    )

    game_profiles: Mapped[list["GameProfileORM"]] = relationship(
        secondary=game_profile_roles,
        back_populates="roles"
    )

    role_profiles: Mapped[list["RoleProfileORM"]] = relationship(
        back_populates="role"
    )