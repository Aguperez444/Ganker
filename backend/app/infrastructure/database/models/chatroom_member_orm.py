from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.infrastructure.database.models.chatroom_orm import ChatroomORM
    from app.infrastructure.database.models.user_orm import UserORM


class ChatroomMemberORM(Base):
    __tablename__ = "chatroom_member"

    chatroom_member_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    chatroom_id: Mapped[int] = mapped_column(ForeignKey("chatroom.chatroom_id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.user_id"), nullable=False)

    # Relaciones
    chatroom: Mapped["ChatroomORM"] = relationship(back_populates="members")
    user: Mapped["UserORM"] = relationship()
