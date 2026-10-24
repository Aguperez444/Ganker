from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Integer, ForeignKey, String, DateTime, Boolean, func
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models import UserORM


class PasswordResetTokenORM(Base):
    __tablename__ = "password_reset_tokens"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)

    # SHA-256 en formato hex siempre mide exactamente 64 caracteres
    token_hash = mapped_column(String(64), nullable=False, unique=True, index=True)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used = mapped_column(Boolean, default=False, nullable=False)
    create_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        nullable=False
    )

    user: Mapped["UserORM"] = relationship("UserORM", back_populates="password_reset_tokens")
