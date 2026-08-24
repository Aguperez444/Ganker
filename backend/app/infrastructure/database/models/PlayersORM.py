from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

class PlayerORM(Base):
    
    __tablename__ = "Players"

    player_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    username: Mapped[str] = mapped_column(String, nullable=False)

    mail: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    password_hash: Mapped[str] = mapped_column(String, nullable=False)