from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, ForeignKey, String, DateTime
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models import UserORM


class UserBanRecordORM(Base):
    __tablename__ = "user_ban_record"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    banned_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    banned_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.user_id", ondelete="SET NULL"), nullable=True)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    banned_user: Mapped["UserORM"] = relationship("UserORM", foreign_keys=[banned_user_id], back_populates="banned_player")
    banned_by_user: Mapped["UserORM"] = relationship("UserORM", foreign_keys=[banned_by_user_id], back_populates="moderator_banned_player")
