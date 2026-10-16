from typing import Optional, TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.game_usage_report_orm import GameUsageReportORM


class GameUsageReportItemORM(Base):
    __tablename__ = "game_usage_report_item"

    item_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("game_usage_report.report_id"), nullable=False)
    # Snapshot de la entidad representada (rango, personaje o videojuego). Es null en las franjas de rangos.
    category_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    icon_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    rank_range: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    variation: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    variation_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trend: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Relaciones
    report: Mapped["GameUsageReportORM"] = relationship(back_populates="items")
