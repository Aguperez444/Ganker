from typing import cast, Optional, BinaryIO

from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.user.username_already_exist_exception import UsernameAlreadyExistsException
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.infrastructure.api.dto.response.update_user_response import UpdateUserResponse


class UpdateUser:

    def __init__(self, unit_of_work: IUnitOfWork, storage_service: IStorageService):
        self.uow: IUnitOfWork = unit_of_work
        self.storage_service: IStorageService = storage_service

    def execute(self, user_id: int, username: str, name: str, mail: str,
                icon_file: Optional[BinaryIO] = None, icon_filename: Optional[str] = None) -> UpdateUserResponse:
        cambio_icono: bool = False
        old_icon_url: str | None = None
        with self.uow as uow:
            # Valido que el nuevo username y mail no existan en la base de datos para otro jugador
            self.validate_username_uniqueness(username, user_id, uow)
            self.validate_mail_uniqueness(mail, user_id, uow)
            # Busco al jugador a actualizar (Doy por hecho que el id existe porque lo tomé de una sesión vigente)
            user = uow.user_repo.get_user_by_id(user_id)

            if not user:
                raise UserNotFoundException(user_id)

            # Actualizo los datos del jugador con los nuevos valores
            user.name = name
            user.username = username
            user.mail = mail

            new_icon_url = user.icon_url  # por defecto persisto la url anterior
            # si me llegó una imagen nueva
            if icon_file and icon_filename:
                try:
                    # actualizo la bandera de cambio de icono
                    cambio_icono = True
                    old_icon_url = user.icon_url
                    # Guardo la nueva imagen a través del puerto
                    new_icon_url = self.storage_service.save_image_file(
                        file_content=icon_file,
                        filename=icon_filename,
                        subfolder=f"users/icons",
                        preserve_original_name=False
                    )
                except Exception as e:
                    # Si hay un error al subir la imagen, se lanza una excepción
                    raise Exception(f"Error inesperado al subir la nueva imagen del jugador", str(e))

            # actualizo la url del icono del jugador con la nueva url de la imagen subida, o persisto la anterior si no se subió ninguna nueva imagen
            user.icon_url = new_icon_url

            try:
                # Guardo los cambios en la base de datos
                updated_user = uow.user_repo.update_user(user)
            except Exception as e:
                # si se había guardado un icono nuevo
                if cambio_icono:
                    if new_icon_url is not None:
                        #borrar la imagen que se subio para no persistir basura
                         self.storage_service.delete_file(new_icon_url)
                # Si hay un error al actualizar, se lanza una excepción
                raise Exception(f"Error inesperado al actualizar los datos del usuario", str(e))

            try:
                # si pude guardar correctamente los cambios en la bdd, ahora si debo borrar la imagen anterior si es que se subió una nueva
                if cambio_icono and old_icon_url is not None:
                    #borrar la imagen anterior para no persistir basura
                     self.storage_service.delete_file(old_icon_url)
            except Exception:
                # Si hay un error al borrar la imagen anterior, se informa por consola, pero no se lanza una excepción
                # porque el usuario ya fue actualizado correctamente y no quiero que eso afecte la respuesta al cliente
                from colorama import Fore, Style
                print(Fore.RED + "-"*70 + "\n" + "Error inesperado al borrar la imagen anterior del usuario" + "-"*70 + "\n" + Style.RESET_ALL)


        # Lo devuelvo para que el controlador pueda mandarlo en la respuesta
        return UpdateUserResponse(
            user_id=cast(int, updated_user.user_id),
            username=updated_user.username,
            name=updated_user.name,
            mail=updated_user.mail,
            icon_url=updated_user.icon_url
        )

    # Funciones de validación para asegurar que el username y mail sean únicos en la base de datos
    @staticmethod
    def validate_username_uniqueness(username: str, current_user_id: int, uow: IUnitOfWork) -> bool:
        found_user = uow.user_repo.get_user_by_username(username)
        if found_user and found_user.user_id != current_user_id:
            raise UsernameAlreadyExistsException(username)
        return True

    @staticmethod
    def validate_mail_uniqueness(mail: str, current_user_id: int, uow: IUnitOfWork) -> bool:
        found_user = uow.user_repo.get_user_by_mail(mail)
        if found_user and found_user.user_id != current_user_id:
            raise EmailAlreadyExistsException(mail)
        return True