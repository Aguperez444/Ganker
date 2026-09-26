from typing import cast
from fastapi import UploadFile

from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.role.duplicated_role_name_exception import DuplicateRoleNameException
from app.domain.exceptions.role.invalid_role_name_exception import InvalidRoleNameException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.services.slug_service import SlugService
from app.infrastructure.api.dto.response.base_classes.role_object_response import RoleObjectResponse


class UpdateRole:
    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service = storage_service
        self.uow: IUnitOfWork = uow

    def execute(
        self,
        role_id: int,
        name: str,
        icon: UploadFile | None = None
    ) -> RoleObjectResponse:
        # Comprobar que el nombre no esté vacío
        if not name or not name.strip():
            raise InvalidRoleNameException(name if name is not None else "")

        cleaned_name = name.strip()

        with self.uow as uow:
            existing_role = uow.role_repo.get_role_by_id(role_id)
            if not existing_role:
                raise RoleNotFoundException(role_id)

            # Comprobar que no hay otro rol en el mismo videojuego con el mismo nombre
            game_id = existing_role.videogame.videogame_id
            existing_roles = uow.role_repo.get_roles_by_game_id(cast(int, game_id))
            for other_role in existing_roles:
                if other_role.role_id != role_id:
                    if other_role.name == cleaned_name:
                        raise DuplicateRoleNameException(cleaned_name)

            new_icon_url = None
            if icon and icon.filename:
                game_folder = SlugService.to_slug(existing_role.videogame.name)

                new_icon_url = self.storage_service.save_image_file(
                    file_content=icon.file,
                    filename=icon.filename,
                    subfolder=f"games/{game_folder}/roles",
                    preserve_original_name=True
                )
                old_icon_url = existing_role.icon_url
                existing_role.icon_url = new_icon_url
            else:
                old_icon_url = None

            existing_role.name = cleaned_name

            try:
                updated_role = uow.role_repo.update_role(existing_role)
            except Exception as e:
                if new_icon_url:
                    self.storage_service.delete_file(new_icon_url)
                raise e

            if old_icon_url:
                try:
                    self.storage_service.delete_file(old_icon_url)
                except Exception as e:
                    print(f'Error al borrar la imagen {old_icon_url}')

        return RoleObjectResponse(
            role_id=cast(int, updated_role.role_id),
            name=updated_role.name,
            icon_url=updated_role.icon_url,
        )
