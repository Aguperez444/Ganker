from app.application.ports.i_password_hasher import IPasswordHasher
from argon2 import PasswordHasher

class PasswordHashService(IPasswordHasher):
    def __init__(self):
        self._hasher = PasswordHasher()

    def hash_password(self, password: str) -> str:
        return self._hasher.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            return self._hasher.verify(hashed_password, plain_password)
        except Exception: #TODO revisar, seguramente me esté cargando alguna excepción de argon2 que debería capturar
            return False