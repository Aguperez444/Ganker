import re

from typing import TYPE_CHECKING, cast

from app.application.ports.i_password_hasher import IPasswordHasher
from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.invalid_username_exception import InvalidUsernameException
from app.domain.exceptions.password_is_not_secure_exception import PasswordIsNotSecureException
from app.domain.exceptions.username_already_exist_exception import UsernameAlreadyExistsException
from app.domain.models.player import Player
from app.infrastructure.api.dto.auth_tokens_response import AuthTokensResponse

if TYPE_CHECKING:
    from app.infrastructure.api.dto.register_player_request import RegisterPlayerRequest



class RegisterPlayer:
    def __init__(self, unit_of_work: IUnitOfWork, token_service: ITokenService, password_hasher: IPasswordHasher):
        self.uow: IUnitOfWork = unit_of_work
        self.token_service: ITokenService = token_service
        self.pass_hasher: IPasswordHasher = password_hasher

    def execute(self, player_data: 'RegisterPlayerRequest') -> AuthTokensResponse:
        # Se asume que lo que me llega es un mail por la validación de pydantic en el dto.
        # Validar que no exista otra cuenta con ese mail
        if not self.validate_mail(player_data.mail):
            raise EmailAlreadyExistsException(player_data.mail)

        # Validar que no exista otra cuenta con ese username y que el mismo sea válido
        if not self.validate_username(player_data.username):
            raise UsernameAlreadyExistsException(player_data.username)

        # Validar que la contraseña cumpla el criterio de seguridad (mínimo 8 caracteres,
        # al menos una mayúscula, al menos una minúscula y al menos un número)
        self.validate_password_security(player_data.password)

        # crear el usuario en el dominio
        new_player = Player(None, player_data.username, player_data.name, player_data.mail, player_data.password, [])

        #hashear la password del usuario antes de persistirlo en la base de datos
        new_player.password_hash = self.pass_hasher.hash_password(player_data.password)

        # persistir el usuario en la base de datos y obtener el usuario registrado con su id
        with self.uow as uow:
            registered_player = uow.player_repo.create_player(new_player)

        access_token, refresh_token = self.token_service.generate_tokens(cast(int, registered_player.player_id))

        return AuthTokensResponse(access_token, refresh_token)




    def validate_username(self, username: str) -> bool:
        if username is None or username.strip() == "":
            raise InvalidUsernameException(username)
        with self.uow as uow:
            usuario_con_ese_username = uow.player_repo.get_player_by_username(username)
        return usuario_con_ese_username is None


    def validate_mail(self, mail: str) -> bool:
        with self.uow as uow:
            usuario_con_ese_mail = uow.player_repo.get_player_by_mail(mail)
        return usuario_con_ese_mail is None


    @staticmethod
    def validate_password_security(password: str) -> bool:
        if len(password) < 8:
            raise PasswordIsNotSecureException("Debe tener al menos 8 caracteres")

        if not re.search(r"[A-Z]", password):  # Mayúscula
            raise PasswordIsNotSecureException("Debe contener al menos una letra mayúscula")

        if not re.search(r"[a-z]", password):  # Minúscula
            raise PasswordIsNotSecureException("Debe contener al menos una letra minúscula")

        if not re.search(r"\d", password):  # Número
            raise PasswordIsNotSecureException("Debe contener al menos un número")

        return True
