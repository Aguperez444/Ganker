from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.infrastructure.database.models.game_profile_orm import GameProfileORM
    from app.infrastructure.database.models.rank_orm import RankORM
    from app.infrastructure.database.models.role_orm import RoleORM


class RoleProfileORM(Base):
    __tablename__ = "role_profile"

    role_profile_id: Mapped[Optional[int]] = mapped_column(primary_key=True, autoincrement=True)
    game_profile_id: Mapped[Optional[int]] = mapped_column(ForeignKey("game_profile.game_profile_id"), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("role.role_id"), nullable=False)
    rank_id: Mapped[int] = mapped_column(ForeignKey("rank.rank_id"), nullable=False)

    # Relaciones
    game_profile: Mapped["GameProfileORM"] = relationship(back_populates="role_profiles")
    role: Mapped["RoleORM"] = relationship(back_populates="role_profiles")
    rank: Mapped["RankORM"] = relationship(back_populates="role_profiles")