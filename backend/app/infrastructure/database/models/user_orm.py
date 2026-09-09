from typing import List, Optional
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.infrastructure.database.models.game_profile_orm import GameProfileORM
    from app.infrastructure.database.models.refresh_token_orm import RefreshTokenORM


class UserORM(Base):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    mail: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, nullable=False, default="player")
    icon_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relaciones
    game_profiles: Mapped[List["GameProfileORM"]] = relationship(back_populates="user")
    refresh_tokens: Mapped[List["RefreshTokenORM"]] = relationship(back_populates="user")