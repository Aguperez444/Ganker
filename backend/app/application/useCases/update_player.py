from typing import cast

from fastapi import UploadFile

from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.models.user import User
from app.domain.exceptions.user.username_already_exist_exception import UsernameAlreadyExistsException
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException


class UpdateUser:

    def __init__(self, unit_of_work: IUnitOfWork, storage_service: IStorageService):
        self.uow: IUnitOfWork = unit_of_work
        self.storage_service: IStorageService = storage_service

    async def execute(self, user_id: int, username: str, name: str, mail: str, icon: UploadFile) -> User:

        # Valido que el nuevo username y mail no existan en la base de datos para otro jugador
        self.validate_username_uniqueness(username, user_id)
        self.validate_mail_uniqueness(mail, user_id)

        # Busco al jugador a actualizar (Doy por hecho que el id existe porque lo tomé de una sesión vigente)
        user = self.uow.user_repo.get_user_by_id(user_id)

        if not user:
            raise UserNotFoundException(user_id)

        # Actualizo los datos del jugador con los nuevos valores
        user.name = name
        user.username = username
        user.mail = mail

        # Guardo los cambios en la base de datos
        with self.uow as uow:

            if user.icon_url is not None:
                # Elimino la imagen anterior a través del puerto
                await self.storage_service.delete_file(cast(str,user.icon_url))

            if icon and icon.filename:
                # Guardar la nueva imagen a través del puerto
                new_icon_url = await self.storage_service.save_file(
                    file_content=icon.file,
                    filename=icon.filename,
                    subfolder=f"users/icons",
                    preserve_original_name=False
                )

            user.icon_url = new_icon_url



            try:
                updated_user = uow.user_repo.update_user(user)
            except Exception as e:
                #borrar la imagen que se subio para no persistir basura
                await self.storage_service.delete_file(new_icon_url)
                # Si hay un error al actualizar, se lanza una excepción
                raise Exception(f"Error inesperado al actualizar los datos del usuario", str(e))



        # Lo devuelvo para que el controlador pueda mandarlo en la respuesta
        return updated_user

    # Funciones de validación para asegurar que el username y mail sean únicos en la base de datos
    def validate_username_uniqueness(self, username: str, current_user_id: int) -> bool:
        with self.uow as uow:
            found_user = uow.user_repo.get_user_by_username(username)
            if found_user and found_user.user_id != current_user_id:
                raise UsernameAlreadyExistsException(username)
            return True

    def validate_mail_uniqueness(self, mail: str, current_user_id: int) -> bool:
        with self.uow as uow:
            found_user = uow.user_repo.get_user_by_mail(mail)
            if found_user and found_user.user_id != current_user_id:
                raise EmailAlreadyExistsException(mail)
            return True