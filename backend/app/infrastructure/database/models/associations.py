from sqlalchemy import Table, Column, ForeignKey

from app.domain.models import game_profile
from app.infrastructure.database.base import Base

game_profile_roles = Table(
    "game_profile_roles",
    Base.metadata,
    Column("game_profile_id", ForeignKey("game_profiles.profile_id"), primary_key=True),
    Column("role_id", ForeignKey("roles.role_id"), primary_key=True)
)

game_profile_characters = Table(
    "game_profile_characters",
    Base.metadata,
    Column("game_profile_id", ForeignKey("game_profiles.profile_id"), primary_key=True),
    Column("character_id", ForeignKey("characters.character_id"), primary_key=True)
)

character_roles = Table(
    "character_roles",
    Base.metadata,
    Column("character_id", ForeignKey("characters.character_id"), primary_key=True),
    Column("role_id", ForeignKey("roles.role_id"), primary_key=True)
)

role_profile_characters = Table(
    "role_profile_characters",
    Base.metadata,
    Column("role_profile_id", ForeignKey("role_profiles.role_profile_id"), primary_key=True),
    Column("character_id", ForeignKey("characters.character_id"), primary_key=True)
)