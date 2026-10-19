from datetime import datetime
from typing import TYPE_CHECKING
from enum import Enum
from sqlalchemy import ForeignKey, Integer, String, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_orm import UserORM

class ReportStatus(str, Enum):
    PENDING = "pending"
    RESOLVED = "resolved"
    REJECTED = "rejected"

class ReportReason(str, Enum):
    CHEATING = "cheating"
    ABUSIVE_BEHAVIOR = "abusive_behavior"
    SPAMMING = "spamming"
    INAPPROPRIATE_CONTENT = "inappropriate_content"
    OTHER = "other"


class PlayerReportORM(Base):

    __tablename__ = "player_report"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    reporter_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    reported_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(SQLEnum(ReportStatus),default=ReportStatus.PENDING, nullable=False)
    reason: Mapped[str] = mapped_column(SQLEnum(ReportReason),nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    create_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[int] = mapped_column(Integer, ForeignKey("user.user_id", ondelete="SET NULL"), nullable=True)

    reporter: Mapped["UserORM"] = relationship("UserORM", foreign_keys=[reporter_id], back_populates="reporter_player")
    reported: Mapped["UserORM"] = relationship("UserORM", foreign_keys=[reported_id], back_populates="reported_player")
    resolver_player: Mapped["UserORM"] = relationship("UserORM", foreign_keys=[resolved_by], back_populates="resolver_player")

