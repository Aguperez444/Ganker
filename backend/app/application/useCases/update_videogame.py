from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.update_videogame_request import UpdateVideogameRequest
from app.domain.models.videogame import Videogame
from app.domain.exceptions.invalid_videogame_name_exception import InvalidVideogameNameException
from app.domain.exceptions.videogame_already_exists_exception import VideogameAlreadyExistsException
from app.domain.exceptions.videogame_not_found_exception import VideogameNotFoundException

class UpdateVideogame:
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, videogame_id: int, update_videogame_request: UpdateVideogameRequest) -> Videogame:
        pass
        existing_game = self.validate_videogame_id(videogame_id)
        cleaned_name = self.validate_videogame_name(update_videogame_request)
        self.validate_name_uniqueness(cleaned_name, videogame_id)

        #actualizar juego
        existing_game.name = cleaned_name
        with self.uow as uow:
            updated_game = uow.videogame_repo.update_videogame(existing_game)

        return updated_game

    # Validar existencia del juego
    def validate_videogame_id(self, videogame_id: int) -> Videogame:
        with self.uow as uow:
            found_videogame = uow.videogame_repo.get_videogame_by_id(videogame_id)
            if not found_videogame:
                raise VideogameNotFoundException(videogame_id)
            return found_videogame

    def validate_videogame_name(self, videogame_request: UpdateVideogameRequest) -> str:
        if not videogame_request.name or not videogame_request.name.strip():
            raise InvalidVideogameNameException(videogame_request.name)
        return videogame_request.name.strip()

    # Validar que el nombre no exista en la base de datos
    def validate_name_uniqueness(self, cleaned_name: str, current_game_id: int) -> bool:
        with self.uow as uow:
            found_videogame = uow.videogame_repo.get_videogame_by_name(cleaned_name.lower())
            if found_videogame and found_videogame.videogame_id != current_game_id:
                raise VideogameAlreadyExistsException(cleaned_name)
            return True



