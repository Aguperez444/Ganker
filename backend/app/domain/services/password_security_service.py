import re
from app.domain.exceptions.auth.password_is_not_secure_exception import PasswordIsNotSecureException


class PasswordSecurityService:

    @staticmethod
    def validate(password: str) -> bool:
        if len(password) < 8:
            raise PasswordIsNotSecureException("Debe tener al menos 8 caracteres")

        if not re.search(r"[A-Z]", password):  # Mayúscula
            raise PasswordIsNotSecureException("Debe contener al menos una letra mayúscula")

        if not re.search(r"[a-z]", password):  # Minúscula
            raise PasswordIsNotSecureException("Debe contener al menos una letra minúscula")

        if not re.search(r"\d", password):  # Número
            raise PasswordIsNotSecureException("Debe contener al menos un número")

        return True
