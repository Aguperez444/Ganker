from typing import List
from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.infrastructure.database.models.role_profile_orm import RoleProfileORM
    from app.infrastructure.database.models.videogame_orm import VideogameORM


class RoleORM(Base):
    __tablename__ = "role"

    role_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    videogame_id: Mapped[int] = mapped_column(ForeignKey("videogame.videogame_id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    icon_url: Mapped[str] = mapped_column(String, nullable=False)

    # Relaciones
    videogame: Mapped["VideogameORM"] = relationship(back_populates="roles")
    role_profiles: Mapped[List["RoleProfileORM"]] = relationship(back_populates="role")

    # Constraints
    __table_args__ = (UniqueConstraint("videogame_id", "name", name="uq_videogame_role_name"),)