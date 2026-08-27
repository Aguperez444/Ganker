from app.application.ports.i_password_hasher import IPasswordHasher
from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.mail_not_found_exception import EmailNotFoundException


from typing import TYPE_CHECKING, cast

from app.domain.exceptions.wrong_password_exception import WrongPasswordException
from app.infrastructure.api.dto.auth_tokens_response import AuthTokensResponse

if TYPE_CHECKING:
    from app.infrastructure.api.dto.login_request import LoginRequest

class UserLogin:
    def __init__(self, uow: IUnitOfWork, token_service: ITokenService, password_hasher: IPasswordHasher):
        self.uow: IUnitOfWork = uow
        self.token_service: ITokenService = token_service
        self.pass_hasher: IPasswordHasher = password_hasher



    def execute(self, player_data: 'LoginRequest') -> AuthTokensResponse:
        pass

        # revisar si el mail pertenece a un usuario registrado
        with self.uow:
            user = self.uow.player_repo.get_player_by_mail(player_data.mail)

        if user is None:
            raise EmailNotFoundException(player_data.mail)

        # caso que se haya encontrado el usuario, comprobar la contraseña contra la del usuario encontrado
        if not self.pass_hasher.verify_password(player_data.password, cast(str, user.password_hash)): #TODO revisar este cast, cuando empecemos a usar cuentas por identidad federada puede llegar a darse el caso de que password sea None
            raise WrongPasswordException(player_data.mail)

        # si la contraseña es correcta, generar un token de acceso
        access_token, refresh_token = self.token_service.generate_tokens(cast(int, user.player_id))
        return AuthTokensResponse(access_token, refresh_token)