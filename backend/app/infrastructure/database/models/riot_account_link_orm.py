from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.game_profile_orm import GameProfileORM


class RiotAccountLinkORM(Base):
    __tablename__ = "riot_account_link"

    riot_account_link_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    game_profile_id: Mapped[int] = mapped_column(
        ForeignKey("game_profile.game_profile_id", ondelete="CASCADE"), nullable=False, unique=True
    )
    # No es único: la misma cuenta puede estar en el perfil de LoL y en el de Valorant del jugador
    puuid: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    game_name: Mapped[str] = mapped_column(String(16), nullable=False)
    tag_line: Mapped[str] = mapped_column(String(5), nullable=False)
    server: Mapped[str] = mapped_column(String(10), nullable=False)
    # Última "foto" de las estadísticas tal como vino de Riot (ver RiotAccountLinkMapper)
    stats: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    last_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relaciones
    game_profile: Mapped["GameProfileORM"] = relationship(back_populates="riot_account_link")
