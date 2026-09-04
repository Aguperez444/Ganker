from typing import BinaryIO
from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork

from app.domain.exceptions.videogame_not_found_exception import VideogameNotFoundException
from app.domain.services.slug_service import SlugService
from app.domain.models.role import Role
from app.domain.exceptions.duplicated_role_name_exception import DuplicateRoleNameException
from app.domain.exceptions.invalid_role_name_exception import InvalidRoleNameException


class CreateRoleUseCase:
    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service = storage_service
        self.uow: IUnitOfWork = uow

    async def execute(self, game_id: int, name: str, icon_stream: BinaryIO, filename: str) -> Role:
        # Comprobar que el nombre no está vacío
        if not name.strip():
            raise InvalidRoleNameException(name)

        # Comprobar que existe el juego
        with self.uow as uow:
            game = uow.videogame_repo.get_videogame_by_id(game_id)
            if not game:
                raise VideogameNotFoundException(game_id)

            # obtener los rangos de ese juego y comprobar que no hay otro rango con el mismo valor o nombre
            existing_roles = uow.role_repo.get_roles_by_game_id(game_id)
            for role in existing_roles:
                if role.name == name:
                    raise DuplicateRoleNameException(name)

            # confirmado que este rango es nuevo y único para ese juego, se puede crear y persistir
            # Sanitizar el nombre del juego para la sub carpeta (ej: "League of Legends" -> "league_of_legends")
            game_folder = SlugService.to_slug(game.name)

            # Guardar imagen a través del puerto
            icon_url = await self.storage_service.save_file(
                file_content=icon_stream,
                filename=filename,
                subfolder=f"{game_folder}/roles",
                preserve_original_name=True
            )

            # Persistir los cambios con seguridad de rollback si algo falla
            try:
                # Crear entidad de dominio con la URL resuelta
                new_role = Role(role_id=None, name=name, icon_url=icon_url, videogame=game)

                # Persistir en base de datos vía repositorio
                saved_role = uow.role_repo.save_role(new_role)
            except Exception as e:
                # Evitar basura en disco si la BD rechaza la inserción
                await self.storage_service.delete_file(icon_url)
                raise e # volver a levantar la excepción después de limpiar el archivo para hacer rollback

        return saved_role