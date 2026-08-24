from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String, ForeignKey
from app.infrastructure.database.base import Base

class Character(Base):
    __tablename__ = 'characters'

    character_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String, nullable=False)

    videogame_id: Mapped[int] = mapped_column(Integer, ForeignKey("videogames.videogame_id"), nullable=False)