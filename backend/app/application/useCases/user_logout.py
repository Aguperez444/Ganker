from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.Invalid_token_exception import InvalidTokenException


class UserLogout:
    def __init__(self, ouw: IUnitOfWork, token_service: ITokenService):
        self.uow: IUnitOfWork = ouw
        self.token_service = token_service

    def execute(self, refresh_token: str) -> None:
        token_data = self.token_service.verify_refresh_token(refresh_token)
        jti = token_data.get("jti")

        with self.uow:
            revoked = self.uow.refresh_token_repo.revoke_by_jti(jti)
            if not revoked:
                raise InvalidTokenException("Token revoked")
