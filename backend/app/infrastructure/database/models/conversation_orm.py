from typing import List, TYPE_CHECKING, Optional
from sqlalchemy import ForeignKey, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.message_orm import MessageORM
    from app.infrastructure.database.models.conversation_member_orm import ConversationMemberORM
    from app.infrastructure.database.models.team_orm import TeamORM

class ConversationORM(Base):
    __tablename__ = "conversation"

    conversation_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    type: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relaciones
    members: Mapped[List["ConversationMemberORM"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan"
    )
    
    messages: Mapped[List["MessageORM"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="MessageORM.timestamp"
    )

    teams: Mapped[List["TeamORM"]] = relationship(back_populates="conversation")
