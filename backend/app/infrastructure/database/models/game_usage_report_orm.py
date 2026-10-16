from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.game_usage_report_item_orm import GameUsageReportItemORM


def _now_utc_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class GameUsageReportORM(Base):
    __tablename__ = "game_usage_report"

    report_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    generated_by: Mapped[int] = mapped_column(ForeignKey("user.user_id"), nullable=False)
    analysis_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # Snapshot del videojuego al momento de generar el reporte (no es FK para que el reporte sobreviva a bajas del catálogo)
    videogame_id: Mapped[int] = mapped_column(Integer, nullable=False)
    videogame_name: Mapped[str] = mapped_column(String, nullable=False)
    icon_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    previous_report_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("game_usage_report.report_id"), nullable=True
    )
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now_utc_naive)
    total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relaciones
    items: Mapped[List["GameUsageReportItemORM"]] = relationship(
        back_populates="report",
        cascade="all, delete-orphan",
        order_by="GameUsageReportItemORM.count.desc()"
    )
