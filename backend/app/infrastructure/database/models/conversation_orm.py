from typing import List, TYPE_CHECKING
from sqlalchemy import ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_orm import UserORM
    from app.infrastructure.database.models.message_orm import MessageORM


class ConversationORM(Base):
    __tablename__ = "conversation"

    conversation_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_1_id: Mapped[int] = mapped_column(ForeignKey("user.user_id"), nullable=False)
    user_2_id: Mapped[int] = mapped_column(ForeignKey("user.user_id"), nullable=False)

    # Relaciones
    user_1: Mapped["UserORM"] = relationship(
        "UserORM",
        foreign_keys=[user_1_id],
        back_populates="conversations_as_user_1",
    )
    user_2: Mapped["UserORM"] = relationship(
        "UserORM",
        foreign_keys=[user_2_id],
        back_populates="conversations_as_user_2",
    )
    messages: Mapped[List["MessageORM"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="MessageORM.timestamp"
    )

    __table_args__ = (
        UniqueConstraint("user_1_id", "user_2_id", name="uq_users_chat"),
        CheckConstraint("user_1_id < user_2_id", name="ck_user_order"),
    )