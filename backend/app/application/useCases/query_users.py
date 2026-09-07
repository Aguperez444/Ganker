from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.get_player_response import GetUserResponse
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.services.create_game_profile_dto_service import CreateGameProfileDTOService

class QueryUsers:
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def get_by_id(self, user_id: int) -> GetUserResponse:
        with self.uow as uow:
            #obtener el player de la base de datos usando el repositorio de players
            user = uow.user_repo.get_user_by_id(user_id)

            if user is None:
                raise UserNotFoundException()

            return GetUserResponse(
                username=user.username,
                name=user.name,
                mail=user.mail,
                profiles=[CreateGameProfileDTOService.create_game_profile(profile) for profile in user.profiles],
                role=user.role
            )


