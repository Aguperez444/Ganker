from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_orm import UserORM


class DiscordAccountLinkORM(Base):
    __tablename__ = "discord_account_link"

    discord_account_link_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False, unique=True)
    discord_user_id: Mapped[str] = mapped_column(String(30), nullable=False, unique=True)
    username: Mapped[str] = mapped_column(String(40), nullable=False)
    global_name: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    visibility: Mapped[str] = mapped_column(String(20), nullable=False, default="teammates")
    linked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relaciones
    user: Mapped["UserORM"] = relationship(back_populates="discord_account_link")
