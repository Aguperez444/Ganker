from sqlalchemy import Table, Column, ForeignKey, Integer
from app.infrastructure.database.base import Base

# Tabla intermedia simple (sin clase ORM propia)
game_profile_x_characters = Table(
    "game_profile_x_characters",
    Base.metadata,
    Column("game_profiles_x_character_id", Integer, primary_key=True, autoincrement=True),
    Column("game_profile_id", ForeignKey("game_profile.game_profile_id"), nullable=False),
    Column("character_id", ForeignKey("character.character_id"), nullable=False),
)
