from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.infrastructure.database.base import Base


class VideogameORM(Base):
    __tablename__ = "videogames"

    videogame_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String, nullable=False)