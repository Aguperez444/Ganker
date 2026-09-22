from typing import List, Optional
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.infrastructure.database.models.game_profile_orm import GameProfileORM
    from app.infrastructure.database.models.refresh_token_orm import RefreshTokenORM
    from app.infrastructure.database.models.conversation_orm import ConversationORM
    from app.infrastructure.database.models.message_orm import MessageORM


class UserORM(Base):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    mail: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, nullable=False, default="player")
    icon_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)


    # Relaciones
    game_profiles: Mapped[List["GameProfileORM"]] = relationship(back_populates="user")
    refresh_tokens: Mapped[List["RefreshTokenORM"]] = relationship(back_populates="user")
    conversations_as_user_1: Mapped[List["ConversationORM"]] = relationship(
        "ConversationORM",
        foreign_keys="ConversationORM.user_1_id",
        back_populates="user_1"
    )
    conversations_as_user_2: Mapped[List["ConversationORM"]] = relationship(
        "ConversationORM",
        foreign_keys="ConversationORM.user_2_id",
        back_populates="user_2"
    )
    sent_messages: Mapped[List["MessageORM"]] = relationship(
        "MessageORM",
        back_populates="sender"
    )