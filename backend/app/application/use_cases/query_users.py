from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.get.get_user_response import GetUserResponse
from app.infrastructure.api.dto.response.get.get_public_user_response import GetPublicUserResponse
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
                raise UserNotFoundException(user_id)

            return GetUserResponse(
                username=user.username,
                name=user.name,
                mail=user.mail,
                profiles=[CreateGameProfileDTOService.create_game_profile_response(profile) for profile in user.profiles],
                role=user.role,
                icon_url=user.icon_url,
                last_connection=user.last_connection
            )

    def get_public_profile(self, user_id: int) -> GetPublicUserResponse:
        # Lo que ve un jugador al entrar al perfil de otro: sus datos visibles y todos sus perfiles de juego
        with self.uow as uow:
            user = uow.user_repo.get_user_by_id(user_id)

            if user is None:
                raise UserNotFoundException(user_id)

            return GetPublicUserResponse(
                user_id=user.user_id,
                username=user.username,
                name=user.name,
                profiles=[CreateGameProfileDTOService.create_game_profile_response(profile) for profile in user.profiles],
                icon_url=user.icon_url,
                last_connection=user.last_connection
            )


