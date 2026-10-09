from sqlalchemy import Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING, Optional


if TYPE_CHECKING:
    from app.infrastructure.database.models.team_orm import TeamORM
    from app.infrastructure.database.models.user_orm import UserORM
    from app.infrastructure.database.models import RoleORM


class TeamMemberRoleORM(Base):
    __tablename__ = "team_member_role"

    team_member_role_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    team_role_id: Mapped[int] = mapped_column(Integer, nullable=False)
    game_role_id: Mapped[int] = mapped_column(ForeignKey("role.role_id"), nullable=False)
    team_id: Mapped[int] = mapped_column(ForeignKey("team.team_id"), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("user.user_id"), nullable=True)

    # Relaciones
    team: Mapped["TeamORM"] = relationship(back_populates="members_roles")
    user: Mapped["UserORM"] = relationship()
    game_role: Mapped["RoleORM"] = relationship()

    # constraint un solo TeamMemberRole por user_id y team_id
    __table_args__ = (
         UniqueConstraint('user_id', 'team_id', name='uq_user_team'),
    )
