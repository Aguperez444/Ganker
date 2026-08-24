from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.infrastructure.database.base import Base

class PlayerORM(Base):
    
    __tablename__ = "players"

    player_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    username: Mapped[str] = mapped_column(String, nullable=False)

    name: Mapped[str] = mapped_column(String, nullable=False)

    mail: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    profiles: Mapped[list["GameProfileORM"]] = mapped_column(
        relationship("GameProfileORM", back_populates="player", cascade="all, delete-orphan")
    )