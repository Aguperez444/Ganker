from typing import List
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.infrastructure.database.models.chatroom_member_orm import ChatroomMemberORM
    from app.infrastructure.database.models.team_orm import TeamORM


class ChatroomORM(Base):
    __tablename__ = "chatroom"

    chatroom_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    # Relaciones
    members: Mapped[List["ChatroomMemberORM"]] = relationship(back_populates="chatroom")
    teams: Mapped[List["TeamORM"]] = relationship(back_populates="chatroom")
