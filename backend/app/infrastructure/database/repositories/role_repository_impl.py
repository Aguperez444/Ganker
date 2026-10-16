from typing import TYPE_CHECKING, Optional

from sqlalchemy import func
from app.application.ports.i_role_repository import IRoleRepository
from app.infrastructure.database.models.role_orm import RoleORM
from app.infrastructure.database.mappers.role_mapper import RoleMapper

if TYPE_CHECKING:
    from app.domain.models.role import Role

class RoleRepositoryImpl(IRoleRepository):

    def __init__(self, session):
        self.session = session

    def get_role_by_id(self, role_id: int) -> Optional['Role']:
        found = self.session.query(RoleORM).filter(
            RoleORM.role_id == role_id,
            RoleORM.deleted == False,
        ).first()
        if found and found.videogame and getattr(found.videogame, "deleted", False):
            return None
        domain_found = RoleMapper.orm_to_domain(found) if found else None
        return domain_found

    def get_roles_by_game_id(self, game_id: int) -> list['Role']:
        found = self.session.query(RoleORM).filter(
            RoleORM.videogame_id == game_id,
            RoleORM.deleted == False,
        ).all()
        domain_found = [
            RoleMapper.orm_to_domain(role)
            for role in found
            if not (role.videogame and getattr(role.videogame, "deleted", False))
        ]
        return domain_found

    def get_role_by_name_and_videogame(self, name: str, videogame_id: int) -> Optional['Role']:
        found = self.session.query(RoleORM).filter(
            func.lower(RoleORM.name) == func.lower(name.strip()),
            RoleORM.videogame_id == videogame_id,
            RoleORM.deleted == False,
        ).first()
        if found and found.videogame and getattr(found.videogame, "deleted", False):
            return None
        return RoleMapper.orm_to_domain(found) if found else None


    def save_role(self, role: 'Role') -> 'Role':
        orm_role = RoleMapper.domain_to_orm(role)
        self.session.add(orm_role)
        self.session.flush()
        self.session.refresh(orm_role)
        return RoleMapper.orm_to_domain(orm_role)

    def update_role(self, role: 'Role') -> 'Role':
        orm_role = self.session.query(RoleORM).filter(
            RoleORM.role_id == role.role_id,
            RoleORM.deleted == False,
        ).first()
        if orm_role:
            orm_role.name = role.name
            orm_role.icon_url = role.icon_url
            self.session.flush()
            self.session.refresh(orm_role)
            return RoleMapper.orm_to_domain(orm_role)
        return role

    def delete_role(self, role_id: int) -> bool:
        orm_role = self.session.query(RoleORM).filter(RoleORM.role_id == role_id).first()
        if orm_role:
            self.session.delete(orm_role)
            self.session.flush()
            return True
        return False

    def soft_delete_role(self, role_id: int) -> bool:
        orm_role = self.session.query(RoleORM).filter(
            RoleORM.role_id == role_id,
            RoleORM.deleted == False,
        ).first()
        if not orm_role:
            return False
        orm_role.deleted = True
        self.session.flush()
        return True

    def soft_delete_by_videogame_id(self, videogame_id: int) -> int:
        updated = self.session.query(RoleORM).filter(
            RoleORM.videogame_id == videogame_id,
            RoleORM.deleted == False,
        ).update({RoleORM.deleted: True}, synchronize_session='fetch')
        self.session.flush()
        return updated

