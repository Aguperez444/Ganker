from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.user_orm import UserORM


class FederatedIdentityORM(Base):
    __tablename__ = "federated_identity"
    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_federated_provider_account"),
        UniqueConstraint("user_id", "provider", name="uq_federated_user_provider"),
    )

    federated_identity_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.user_id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(20), nullable=False)
    provider_user_id: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    linked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relaciones
    user: Mapped["UserORM"] = relationship("UserORM", back_populates="federated_identities")
