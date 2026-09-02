
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.get_roles_response import GetRolesResponse
from app.infrastructure.api.dto.role_object_response import RoleObjectResponse


class QueryRoles:
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def get_by_game_id(self, game_id: int) -> GetRolesResponse:

        with self.uow as uow:
            roles = uow.role_repo.get_roles_by_game_id(game_id)

        roles_response = [RoleObjectResponse(role_id=role.role_id, name=role.name) for role in roles]

        return GetRolesResponse(roles=roles_response)


