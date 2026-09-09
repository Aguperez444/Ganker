from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_orm import UserORM

class RefreshTokenORM(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.user_id"), nullable=False, index=True)
    user_role: Mapped[str] = mapped_column(String(20), nullable=False)
    jti: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relaciones
    user: Mapped["UserORM"] = relationship("UserORM", back_populates="refresh_tokens")