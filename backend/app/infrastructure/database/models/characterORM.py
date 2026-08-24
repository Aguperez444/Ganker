from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, ForeignKey
from app.infrastructure.database.base import Base
from app.infrastructure.database.models.game_profileORM import GameProfileORM
from app.infrastructure.database.models.roleORM import RoleORM
from app.infrastructure.database.models.role_profileORM import RoleProfileORM
from app.infrastructure.database.models.videogameORM import VideogameORM

from app.infrastructure.database.models.associations import (
    game_profile_characters,
    character_roles,
    role_profile_characters
)

class CharacterORM(Base):
    __tablename__ = 'characters'

    character_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String(100), nullable=False)

    videogame_id: Mapped[int] = mapped_column(Integer, ForeignKey("videogames.videogame_id"), nullable=False)

    videogame: Mapped["VideogameORM"] = relationship(
        back_populates="characters"
    )

    roles: Mapped[list["RoleORM"]] = relationship(
        secondary=character_roles,
        back_populates="characters"
    )

    game_profiles: Mapped[list["GameProfileORM"]] = relationship(
        secondary=game_profile_characters,
        back_populates="characters"
    )

    role_profiles: Mapped[list["RoleProfileORM"]] = relationship(
        secondary=role_profile_characters,
        back_populates="characters"
    )