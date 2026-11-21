from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base


class BanAppealORM(Base):
    __tablename__ = "ban_appeal"
    __table_args__ = (
        UniqueConstraint("ban_record_id", name="uq_ban_appeal_ban_record_id"),
        CheckConstraint("status IN ('pending', 'accepted', 'rejected')", name="valid_ban_appeal_status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ban_record_id: Mapped[int] = mapped_column(ForeignKey("user_ban_record.id", ondelete="CASCADE"), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolver_user_id: Mapped[int | None] = mapped_column(ForeignKey("user.user_id", ondelete="SET NULL"), nullable=True)

    ban = relationship("UserBanRecordORM")
    resolver = relationship("UserORM", foreign_keys=[resolver_user_id])
    images: Mapped[list["BanAppealImageORM"]] = relationship(
        back_populates="appeal", cascade="all, delete-orphan", order_by="BanAppealImageORM.position",
    )


class BanAppealImageORM(Base):
    __tablename__ = "ban_appeal_image"
    __table_args__ = (UniqueConstraint("appeal_id", "position", name="uq_ban_appeal_image_position"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    appeal_id: Mapped[int] = mapped_column(ForeignKey("ban_appeal.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    position: Mapped[int] = mapped_column(nullable=False)
    appeal: Mapped[BanAppealORM] = relationship(back_populates="images")
