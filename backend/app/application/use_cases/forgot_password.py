import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

from pydantic import EmailStr

from app.application.ports.i_unit_of_work import IUnitOfWork


class ForgotPassword:

    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, mail: EmailStr) -> Optional[str]:

        with self.uow as uow:
            #Busco el usuario por el mail
            user = uow.user_repo.get_user_by_mail(mail)
            #Si no lo encuentro o está baneado retorno none para no vulnerar el sistema
            if not user or getattr(user, "banned", False) is True:
                return None

            #Invalido los token sin usar
            uow.reset_token_repo.invalidate_all_user_tokens(user.user_id)

            #Genero el raw_token
            raw_token = secrets.token_urlsafe(32)

            #Calculo el hash
            token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

            #Calculo expiración
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

            #Persisto el hash
            uow.reset_token_repo.create(
                user_id=user.user_id,
                token_hash=token_hash,
                expires_at=expires_at
            )

            return raw_token

