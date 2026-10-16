from typing import Optional, TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.game_profile_report_orm import GameProfileReportORM


class GameProfileReportItemORM(Base):
    __tablename__ = "game_profile_report_item"

    item_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("game_profile_report.report_id"), nullable=False)
    # Snapshot del videojuego al momento de generar el reporte (no es FK para que el reporte sobreviva a bajas del catálogo)
    videogame_id: Mapped[int] = mapped_column(Integer, nullable=False)
    videogame_name: Mapped[str] = mapped_column(String, nullable=False)
    icon_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    profile_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    variation: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    variation_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    trend: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Relaciones
    report: Mapped["GameProfileReportORM"] = relationship(back_populates="items")
