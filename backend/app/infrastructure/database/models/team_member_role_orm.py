from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.infrastructure.database.models.team_orm import TeamORM
    from app.infrastructure.database.models.user_orm import UserORM


class TeamMemberRoleORM(Base):
    __tablename__ = "team_member_role"

    team_member_role_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    role: Mapped[int] = mapped_column(Integer, nullable=False)
    team_id: Mapped[int] = mapped_column(ForeignKey("team.team_id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.user_id"), nullable=False)

    # Relaciones
    team: Mapped["TeamORM"] = relationship(back_populates="members_roles")
    user: Mapped["UserORM"] = relationship()
