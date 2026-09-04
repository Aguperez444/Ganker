from app.domain.models.role import Role
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.models.role_orm import RoleORM
class RoleMapper:

    @staticmethod
    def orm_to_domain(role_orm: RoleORM) -> Role:
        return Role(
            role_id = role_orm.role_id,
            name = role_orm.name,
            videogame = VideogameMapper.orm_to_domain(role_orm.videogame),
            icon_url=role_orm.icon_url
        )

    @staticmethod
    def domain_to_orm(role: Role) -> RoleORM:
        return RoleORM(
            role_id = role.role_id,
            name = role.name,
            videogame_id = role.videogame.videogame_id,
            icon_url=role.icon_url
        )