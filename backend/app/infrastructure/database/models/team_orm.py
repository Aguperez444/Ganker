from typing import List, Optional
from sqlalchemy import String, Boolean, ForeignKey, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.infrastructure.database.models.videogame_orm import VideogameORM
    from app.infrastructure.database.models.region_orm import RegionORM
    from app.infrastructure.database.models.rank_orm import RankORM
    from app.infrastructure.database.models.conversation_orm import ConversationORM
    from app.infrastructure.database.models.team_member_role_orm import TeamMemberRoleORM


class TeamORM(Base):
    __tablename__ = "team"

    team_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    allow_other_regions: Mapped[bool] = mapped_column(Boolean, nullable=False)
    icon_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    videogame_id: Mapped[int] = mapped_column(ForeignKey("videogame.videogame_id"), nullable=False)
    region_id: Mapped[Optional[int]] = mapped_column(ForeignKey("region.region_id"), nullable=True)
    min_rank_id: Mapped[int] = mapped_column(ForeignKey("rank.rank_id"), nullable=False)
    max_rank_id: Mapped[int] = mapped_column(ForeignKey("rank.rank_id"), nullable=False)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversation.conversation_id"), nullable=False)

    # Relaciones
    videogame: Mapped["VideogameORM"] = relationship()
    region: Mapped["RegionORM"] = relationship(back_populates="teams")
    min_rank: Mapped["RankORM"] = relationship(foreign_keys=[min_rank_id])
    max_rank: Mapped["RankORM"] = relationship(foreign_keys=[max_rank_id])
    conversation: Mapped["ConversationORM"] = relationship(back_populates="teams")
    members_roles: Mapped[List["TeamMemberRoleORM"]] = relationship(back_populates="team")
