from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, ForeignKey, String, DateTime
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models import UserORM


class UsersBanned(Base):
    __tablename__ = "users_banned"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    banned_user: Mapped[int] = mapped_column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    banned_by: Mapped[int] = mapped_column(Integer, ForeignKey("user.user_id", ondelete="SET NULL"), nullable=True)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    banned_player: Mapped["UserORM"] = relationship("UserORM", foreign_keys=[banned_user], back_populates="banned_player")
    moderator_banned_player: Mapped["UserORM"] = relationship("UserORM", foreign_keys=[banned_by], back_populates="moderator_banned_player")