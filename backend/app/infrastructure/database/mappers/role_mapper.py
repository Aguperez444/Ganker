from app.domain.models.role import Role
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.models.roleORM import RoleORM
class RoleMapper:

    @staticmethod
    def ORM_to_Domain(roleORM):
        return Role(
            role_id = roleORM.role_id,
            name = roleORM.name,
            videogame = VideogameMapper.ORM_to_Domain(roleORM.videogame)
        )

    @staticmethod
    def Domain_to_ORM(role):
        return RoleORM(
            role_id = role.role_id,
            name = role.name,
            videogame_id = role.videogame_id
        )