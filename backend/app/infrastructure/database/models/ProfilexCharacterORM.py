from sqlalchemy.orm import Mapped
from sqlalchemy.testing.schema import mapped_column
from sqlalchemy import Integer, String
from app.infrastructure.database.base import Base

class profilexcharacterORM(Base):

    __tablename__ = "profilexcharacter"

    profilexcharacter_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    character_id: Mapped[int] = mapped_column(Integer, nullable=False)

    name: Mapped[str] = mapped_column(String, nullable=False)
