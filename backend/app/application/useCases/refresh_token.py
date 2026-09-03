from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.auth_tokens_response import AuthTokensResponse
from app.domain.exceptions.user_not_found_exception import UserNotFoundException
from app.domain.exceptions.Invalid_token_exception import InvalidTokenException


class RefreshToken:
    def __init__(self, uow: IUnitOfWork, token_service: ITokenService):
        self.uow = uow
        self.token_service = token_service

    def execute(self, refresh_token: str) -> AuthTokensResponse:
        # 1. Validar firma del token y extraer datos del payload
        token_data = self.token_service.verify_refresh_token(refresh_token)
        user_id = token_data["user_id"]
        role = token_data["role"]
        old_jti = token_data["jti"]

        with self.uow:
            # 2. Verificar que el token exista en DB y no esté revocado
            if not self.uow.refresh_token_repo.is_valid(old_jti):
                raise InvalidTokenException("El refresh token ha sido revocado o es inválido")

            # 3. Verificar existencia del usuario en DB
            user = self.uow.player_repo.get_player_by_id(user_id)
            if user is None:
                raise UserNotFoundException()

            # 4. Revocar el token viejo (Rotación)
            self.uow.refresh_token_repo.revoke_by_jti(old_jti)

            # 5. Generar nuevo par de tokens
            new_access_token, new_refresh_token, new_jti, new_expires_at = self.token_service.generate_tokens(
                user_id=user_id,
                role=role
            )

            # 6. Guardar el nuevo refresh token
            self.uow.refresh_token_repo.save(
                user_id=user_id,
                role=role,
                jti=new_jti,
                expires_at=new_expires_at
            )

        return AuthTokensResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token
        )