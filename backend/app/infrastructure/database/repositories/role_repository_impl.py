from typing import TYPE_CHECKING, Optional

from app.application.ports.i_role_repository import IRoleRepository

if TYPE_CHECKING:
    from app.domain.models.role import Role

class RoleRepositoryImpl(IRoleRepository):
    def __init__(self, session):
        self.session = session

    def get_role_by_id(self, role_id: int) -> Optional['Role']:
        from app.infrastructure.database.models.role_orm import RoleORM
        from app.infrastructure.database.mappers.role_mapper import RoleMapper

        found = self.session.query(RoleORM).filter(RoleORM.role_id == role_id).first()
        domain_found = RoleMapper.orm_to_domain(found) if found else None
        return domain_found
