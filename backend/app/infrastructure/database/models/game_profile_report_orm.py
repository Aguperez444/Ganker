from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.game_profile_report_item_orm import GameProfileReportItemORM


def _now_utc_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class GameProfileReportORM(Base):
    __tablename__ = "game_profile_report"

    report_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    generated_by: Mapped[int] = mapped_column(ForeignKey("user.user_id"), nullable=False)
    previous_report_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("game_profile_report.report_id"), nullable=True
    )
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now_utc_naive)
    total_profiles: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relaciones
    items: Mapped[List["GameProfileReportItemORM"]] = relationship(
        back_populates="report",
        cascade="all, delete-orphan",
        order_by="GameProfileReportItemORM.profile_count.desc()"
    )
