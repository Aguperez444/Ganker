from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.conversation_orm import ConversationORM
    from app.infrastructure.database.models.user_orm import UserORM


class MessageORM(Base):
    __tablename__ = "message"

    message_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversation.conversation_id"), nullable=False)
    sender_id: Mapped[int] = mapped_column(ForeignKey("user.user_id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    is_read: Mapped[bool] = mapped_column(nullable=False, default=False)



    # Relaciones
    conversation: Mapped["ConversationORM"] = relationship(back_populates="messages")
    sender: Mapped["UserORM"] = relationship(back_populates="sent_messages")