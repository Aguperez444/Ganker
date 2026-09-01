from typing import TYPE_CHECKING, Optional

from app.application.ports.i_role_repository import IRoleRepository
from app.infrastructure.database.models.role_orm import RoleORM
from app.infrastructure.database.mappers.role_mapper import RoleMapper

if TYPE_CHECKING:
    from app.domain.models.role import Role

class RoleRepositoryImpl(IRoleRepository):
    def __init__(self, session):
        self.session = session

    def get_role_by_id(self, role_id: int) -> Optional['Role']:
        found = self.session.query(RoleORM).filter(RoleORM.role_id == role_id).first()
        domain_found = RoleMapper.orm_to_domain(found) if found else None
        return domain_found

    def get_roles_by_game_id(self, game_id: int) -> list['Role']:
        found = self.session.query(RoleORM).filter(RoleORM.videogame_id == game_id).all()
        domain_found = [RoleMapper.orm_to_domain(role) for role in found]
        return domain_found
