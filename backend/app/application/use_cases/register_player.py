from datetime import datetime
from typing import TYPE_CHECKING, cast

from app.application.ports.i_password_hasher import IPasswordHasher
from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.user.invalid_username_exception import InvalidUsernameException
from app.domain.exceptions.user.username_already_exists_exception import UsernameAlreadyExistsException
from app.domain.models.user import User
from app.domain.services.password_security_service import PasswordSecurityService
from app.infrastructure.api.dto.response.auth_tokens_response import AuthTokensResponse
from app.domain.models.user_role import UserRole

if TYPE_CHECKING:
    from app.infrastructure.api.dto.request.register_player_request import RegisterPlayerRequest



class RegisterPlayer:
    def __init__(self, unit_of_work: IUnitOfWork, token_service: ITokenService, password_hasher: IPasswordHasher):
        self.uow: IUnitOfWork = unit_of_work
        self.token_service: ITokenService = token_service
        self.pass_hasher: IPasswordHasher = password_hasher

    def execute(self, player_data: 'RegisterPlayerRequest') -> AuthTokensResponse:
        PasswordSecurityService.validate(player_data.password)

        with self.uow as uow:
            if not self.validate_mail(player_data.mail, uow=uow):
                raise EmailAlreadyExistsException(player_data.mail)

            if not self.validate_username(player_data.username, uow=uow):
                raise UsernameAlreadyExistsException(player_data.username)

            hashed_pass = self.pass_hasher.hash_password(player_data.password)
            new_player = User(None, player_data.username, player_data.name, player_data.mail, hashed_pass, UserRole.PLAYER, [], None, datetime.now())

            registered_player = uow.user_repo.create_user(new_player)
            player_id = cast(int, registered_player.user_id)
            role = registered_player.role

            access_token, refresh_token, jti, expires_at = self.token_service.generate_tokens(
                user_id=player_id,
                role=role
            )

            uow.refresh_token_repo.save(
                user_id=player_id,
                role=role,
                jti=jti,
                expires_at=expires_at
            )

        return AuthTokensResponse(access_token, refresh_token)

    @staticmethod
    def validate_username(username: str, uow: 'IUnitOfWork') -> bool:
        if username is None or username.strip() == "":
            raise InvalidUsernameException(username)
        usuario_con_ese_username = uow.user_repo.get_user_by_username(username)
        return usuario_con_ese_username is None


    @staticmethod
    def validate_mail(mail: str, uow: IUnitOfWork) -> bool:
        usuario_con_ese_mail = uow.user_repo.get_user_by_mail(mail)
        return usuario_con_ese_mail is None

