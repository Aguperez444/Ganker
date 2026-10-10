from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.infrastructure.database.models.conversation_orm import ConversationORM
    from app.infrastructure.database.models.user_orm import UserORM


class ConversationMemberORM(Base):
    __tablename__ = "conversation_member"

    conversation_member_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversation.conversation_id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.user_id"), nullable=False)
    role: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    last_read_message_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relaciones
    conversation: Mapped["ConversationORM"] = relationship(back_populates="members")
    user: Mapped["UserORM"] = relationship(back_populates="conversation_memberships")
