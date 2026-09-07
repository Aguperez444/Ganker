from typing import cast

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.models.user import User
from app.infrastructure.api.dto.update_user_request import UpdateUserRequest
from app.domain.exceptions.user.username_already_exist_exception import UsernameAlreadyExistsException
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException


class UpdateUser:

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, user_id: int, update_user_request: UpdateUserRequest) -> User:

        # Valido que el nuevo username y mail no existan en la base de datos para otro jugador
        self.validate_username_uniqueness(update_user_request.username, user_id)
        self.validate_mail_uniqueness(update_user_request.mail, user_id)

        # Busco al jugador a actualizar (Doy por hecho que el id existe porque lo tomé de una sesión vigente)
        user = self.uow.user_repo.get_user_by_id(user_id)

        # Actualizo los datos del jugador con los nuevos valores
        user.name = update_user_request.name
        user.username = update_user_request.username
        user.mail = update_user_request.mail

        # Guardo los cambios en la base de datos
        with self.uow as uow:
            updated_user = uow.user_repo.update_user(cast(User, user))

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