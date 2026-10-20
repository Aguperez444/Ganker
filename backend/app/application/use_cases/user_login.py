from datetime import datetime

from app.application.ports.i_password_hasher import IPasswordHasher
from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.mail.mail_not_found_exception import EmailNotFoundException

from typing import TYPE_CHECKING

from app.domain.exceptions.auth.wrong_password_exception import WrongPasswordException
from app.infrastructure.api.dto.response.auth_tokens_response import AuthTokensResponse

if TYPE_CHECKING:
    from app.infrastructure.api.dto.request.login_request import LoginRequest

class UserLogin:
    def __init__(self, uow: IUnitOfWork, token_service: ITokenService, password_hasher: IPasswordHasher):
        self.uow: IUnitOfWork = uow
        self.token_service: ITokenService = token_service
        self.pass_hasher: IPasswordHasher = password_hasher



    def execute(self, user_data: 'LoginRequest') -> AuthTokensResponse:

        # revisar si el mail pertenece a un usuario registrado
        with self.uow as uow:
            user = uow.user_repo.get_user_by_mail(user_data.mail)
            if user is None:
                raise EmailNotFoundException(user_data.mail)

            # caso que se haya encontrado el usuario, comprobar la contraseña contra la del usuario encontrado
            if not user.password_hash or not self.pass_hasher.verify_password(user_data.password, user.password_hash):
                raise WrongPasswordException(user_data.mail)

            user_id = user.user_id
            role = user.role

            # Chequeo si el usuario está baneado y, si corresponde, lo desbaneo ----

            uow.moderation_repo.unban_user_if_applicable(user_id)

            # ----------------------------------------------------------------------

            # Generar tokens recibiendo jti y fecha de expiración
            access_token, refresh_token, jti, expires_at = self.token_service.generate_tokens(
                user_id=user_id,
                role=role
            )

            # Persistir el refresh token en la bd
            uow.refresh_token_repo.save(
                user_id=user_id,
                role=role,
                jti=jti,
                expires_at=expires_at
            )

            # Actualizar la fecha de último login del usuario
            user.last_connection = datetime.now()
            uow.user_repo.update_user(user)


        return AuthTokensResponse(access_token, refresh_token)
