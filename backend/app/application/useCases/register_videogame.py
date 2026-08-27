from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.register_videogame_request import RegisterVideogameRequest
from models.videogame import Videogame
from exceptions.invalid_videogame_name_exception import InvalidVideogameNameException
from exceptions.videogame_already_exists_exception import VideogameAlreadyExistsException

class RegisterVideogame:
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, register_videogame_request: RegisterVideogameRequest) -> Videogame:

        cleaned_name = self.validate_videogame_name(register_videogame_request)

        with self.uow:
            self.validate_not_exist_videogame(cleaned_name)

        # Crear el nuevo videojuego
            new_videogame: Videogame = Videogame(
            videogame_id=None,
            name=cleaned_name
            )

        # Persistir el nuevo videojuego en la base de datos
            saved_videogame = self.uow.videogame_repo.register_videogame(new_videogame)
            self.uow.commit()

        return saved_videogame

    # Validar que el nombre del videojuego no esté vacío
    def validate_videogame_name(self, videogame_request: RegisterVideogameRequest) -> str:
        if not videogame_request.name or not videogame_request.name.strip():
            raise InvalidVideogameNameException(videogame_request.name)
        return videogame_request.name.strip()

    # Validar que el videojuego no exista en la base de datos
    def validate_not_exist_videogame(self, cleaned_name: str) -> bool:
        existing_videogame = self.uow.videogame_repo.get_videogame_by_name(cleaned_name)
        if existing_videogame:
            raise VideogameAlreadyExistsException(cleaned_name)
        return True
