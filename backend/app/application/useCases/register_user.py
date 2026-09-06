import re
from typing import cast

from app.application.ports.i_password_hasher import IPasswordHasher
from app.application.ports.i_token_service import ITokenService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.register_player_request import RegisterPlayerRequest
from app.infrastructure.api.dto.register_user_response import RegisterUserResponse
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.password_is_not_secure_exception import PasswordIsNotSecureException
from app.domain.exceptions.user.invalid_username_exception import InvalidUsernameException
from app.domain.exceptions.user.unauthotized_exception import UnauthorizedException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.exceptions.user.username_already_exist_exception import UsernameAlreadyExistsException
from app.domain.models.user import User
from app.domain.models.user_role import UserRole


class RegisterUser:
    def __init__(self, unit_of_work: IUnitOfWork, token_service: ITokenService, password_hasher: IPasswordHasher):
        self.uow: IUnitOfWork = unit_of_work
        self.token_service: ITokenService = token_service
        self.pass_hasher: IPasswordHasher = password_hasher

    def execute(self, user_data: 'RegisterPlayerRequest', actual_user_id: int) -> RegisterUserResponse:
        # Se asume que lo que me llega es un mail por la validación de pydantic en el dto.
        # Validar que no exista otra cuenta con ese mail
        if not self.validate_mail(user_data.mail):
            raise EmailAlreadyExistsException(user_data.mail)

        # Validar que no exista otra cuenta con ese username y que el mismo sea válido
        if not self.validate_username(user_data.username):
            raise UsernameAlreadyExistsException(user_data.username)

        # Validar que la contraseña cumpla el criterio de seguridad (mínimo 8 caracteres,
        # al menos una mayúscula, al menos una minúscula y al menos un número)
        self.validate_password_security(user_data.password)

        # Validar que el rol del usuario sea válido para lo que se está registrando


        user = self.uow.user_repo.get_user_by_id(actual_user_id)
        if user is None:
            raise UserNotFoundException(actual_user_id)

        print(f"Usuario actual: {user.user_id}, rol: {user.role.value}, intentando registrar usuario con rol: {user_data.role}")
        if user.role == UserRole.ADMIN and user_data.role == UserRole.OWNER:
            raise UnauthorizedException(user.user_id, user.role.value, user_data.role)

        # Crear el usuario en el dominio
        new_user = User(None, user_data.username, user_data.name, user_data.mail, user_data.password, UserRole(user_data.role), [])


        #hashear la password del usuario antes de persistirlo en la base de datos
        new_user.password_hash = self.pass_hasher.hash_password(user_data.password)

        # persistir el usuario en la base de datos y obtener el usuario registrado con su id
        with self.uow as uow:
            registered_user = uow.user_repo.create_user(new_user)
            user_id = cast(int, registered_user.user_id)
            # Generar tokens con ID, rol, jti y fecha de expiración
            access_token, refresh_token, jti, expires_at = self.token_service.generate_tokens(
                user_id=user_id,
                role=registered_user.role
            )

            # Persistir el refresh token asociado
            uow.refresh_token_repo.save(
                user_id=user_id,
                role=registered_user.role,
                jti=jti,
                expires_at=expires_at
            )

        return RegisterUserResponse(
            user_id=user_id,
            username=registered_user.username,
            name=registered_user.name,
            mail=registered_user.mail,
            role=registered_user.role
        )

    def validate_username(self, username: str) -> bool:
        if username is None or username.strip() == "":
            raise InvalidUsernameException(username)
        with self.uow as uow:
            usuario_con_ese_username = uow.user_repo.get_user_by_username(username)
        return usuario_con_ese_username is None


    def validate_mail(self, mail: str) -> bool:
        with self.uow as uow:
            usuario_con_ese_mail = uow.user_repo.get_user_by_mail(mail)
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