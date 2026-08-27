from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.auth_tokens_response import AuthTokensResponse
from app.domain.exceptions.user_not_found_exception import UserNotFoundException

class RefreshToken:
    def __init__(self, uow: IUnitOfWork, token_service: ITokenService):
        self.uow = uow
        self.token_service = token_service

    def execute(self, refresh_token: str) -> AuthTokensResponse:
        # 1. Validar token y extraer user_id
        user_id = self.token_service.verify_refresh_token(refresh_token)

        # 2. Verificar existencia del usuario en DB
        with self.uow:
            user = self.uow.player_repo.get_player_by_id(user_id)

        if user is None:
            raise UserNotFoundException()

        # 3. Generar nuevo par (Refresh Token Rotation)
        new_access_token, new_refresh_token = self.token_service.generate_tokens(user_id)

        return AuthTokensResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token
        )