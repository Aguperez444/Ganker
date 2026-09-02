from typing import cast

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.models.player import Player
from app.infrastructure.api.dto.update_player_request import UpdatePlayerRequest
from exceptions.mail_already_exist_exception import MailAlreadyExistsException
from exceptions.username_already_exist_exception import UsernameAlreadyExistsException


class UpdatePlayer:

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, player_id: int, update_player_request: UpdatePlayerRequest) -> Player:

        # Valido que el nuevo username y mail no existan en la base de datos para otro jugador
        self.validate_username_uniqueness(update_player_request.username, player_id)
        self.validate_mail_uniqueness(update_player_request.mail, player_id)

        # Busco al jugador a actualizar (Doy por hecho que el id existe porque lo tomé de una sesión vigente)
        player = self.uow.player_repo.get_player_by_id(player_id)

        # Actualizo los datos del jugador con los nuevos valores
        player.name = update_player_request.name
        player.username = update_player_request.username
        player.mail = update_player_request.mail

        # Guardo los cambios en la base de datos
        with self.uow as uow:
            updated_player = uow.player_repo.update_player(cast(Player, player))

        # Lo devuelvo para que el controlador pueda mandarlo en la respuesta
        return updated_player

    # Funciones de validación para asegurar que el username y mail sean únicos en la base de datos
    def validate_username_uniqueness(self, username: str, current_player_id: int) -> bool:
        with self.uow as uow:
            found_player = uow.player_repo.get_player_by_username(username)
            if found_player and found_player.player_id != current_player_id:
                raise UsernameAlreadyExistsException(username)
            return True

    def validate_mail_uniqueness(self, mail: str, current_player_id: int) -> bool:
        with self.uow as uow:
            found_player = uow.player_repo.get_player_by_mail(mail)
            if found_player and found_player.player_id != current_player_id:
                raise MailAlreadyExistsException(mail)
            return True