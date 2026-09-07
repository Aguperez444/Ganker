import re
from typing import cast, TYPE_CHECKING

from app.application.ports.i_password_hasher import IPasswordHasher
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.register_user_response import RegisterUserResponse
from app.domain.exceptions.mail.email_already_exists_exception import EmailAlreadyExistsException
from app.domain.exceptions.password_is_not_secure_exception import PasswordIsNotSecureException
from app.domain.exceptions.user.invalid_username_exception import InvalidUsernameException
from exceptions.auth.unauthorized_exception import UnauthorizedException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.exceptions.user.username_already_exist_exception import UsernameAlreadyExistsException
from app.domain.models.user import User
from app.domain.models.user_role import UserRole

if TYPE_CHECKING:
    from app.infrastructure.api.dto.register_user_request import RegisterUserRequest

class RegisterUser:
    def __init__(self, unit_of_work: IUnitOfWork,password_hasher: IPasswordHasher):
        self.uow: IUnitOfWork = unit_of_work
        self.pass_hasher: IPasswordHasher = password_hasher

    def execute(self, user_data: 'RegisterUserRequest', authenticated_user_id: int) -> RegisterUserResponse:

        # hacer las validaciones que se puedan antes de abrir sesión contra la bdd:
        # Validar que el username no sea nulo o vacío
        self.validate_username(user_data.username)

        # Validar que la contraseña cumpla el criterio de seguridad (mínimo 8 caracteres,
        # al menos una mayúscula, al menos una minúscula y al menos un número)
        self.validate_password_security(user_data.password)

        # el formato de userRole ya viene validado por pydantic en el dto., así que no hace falta validar eso acá
        # el formato del mail ya viene validado por pydantic en el dto., así que no hace falta validar eso acá tampoco

        # Validar que no exista otra cuenta con ese mail
        with self.uow as uow:
            # Validar que el rol del usuario que creo la request sea válido para lo que se está registrando
            authenticated_user = uow.user_repo.get_user_by_id(authenticated_user_id)
            if authenticated_user is None:
                raise UserNotFoundException(authenticated_user_id)

            self.validate_is_authorized_to_register(authenticated_user, user_data.role)

            # Verificar que no existan duplicaciones de datos importantes
            # Se asume que lo que me llega es un mail por la validación de pydantic en el dto.
            if self.email_is_duplicated(user_data.mail, uow):
                raise EmailAlreadyExistsException(user_data.mail)

            # Validar que no exista otra cuenta con ese username y que el mismo sea válido
            if self.username_is_duplicated(user_data.username, uow):
                raise UsernameAlreadyExistsException(user_data.username)

            #hashear la password del usuario antes de crearlo en la base de datos
            hashed_pass = self.pass_hasher.hash_password(user_data.password)

            # Crear el usuario en el dominio
            new_user = User(None, user_data.username, user_data.name, user_data.mail, hashed_pass, UserRole(user_data.role), [])

            # persistir el usuario en la base de datos y obtener el usuario registrado con su id
            registered_user = uow.user_repo.create_user(new_user)
            user_id = cast(int, registered_user.user_id)

        return RegisterUserResponse(
            user_id=user_id,
            username=registered_user.username,
            name=registered_user.name,
            mail=registered_user.mail,
            role=registered_user.role
        )
    @staticmethod
    def validate_username(username: str):
        if username is None or username.strip() == "":
            raise InvalidUsernameException(username)

    @staticmethod
    def username_is_duplicated(username: str, uow: IUnitOfWork) -> bool:
        usuario_con_ese_username = uow.user_repo.get_user_by_username(username)
        return usuario_con_ese_username is not None

    @staticmethod
    def email_is_duplicated(mail: str, uow: IUnitOfWork) -> bool:
        usuario_con_ese_mail = uow.user_repo.get_user_by_mail(mail)
        return usuario_con_ese_mail is not None


    @staticmethod
    def validate_password_security(password: str):
        if len(password) < 8:
            raise PasswordIsNotSecureException("Debe tener al menos 8 caracteres")

        if not re.search(r"[A-Z]", password):  # Mayúscula
            raise PasswordIsNotSecureException("Debe contener al menos una letra mayúscula")

        if not re.search(r"[a-z]", password):  # Minúscula
            raise PasswordIsNotSecureException("Debe contener al menos una letra minúscula")

        if not re.search(r"\d", password):  # Número
            raise PasswordIsNotSecureException("Debe contener al menos un número")

    @staticmethod
    def validate_is_authorized_to_register(authenticated_user: User, new_user_role: str):
        if authenticated_user.role == UserRole.PLAYER:
            # un player no puede crear ningún usuario, solo un admin o un owner pueden crear usuarios
            raise UnauthorizedException(cast(int, authenticated_user.user_id), authenticated_user.role.value,
                                        new_user_role)
        elif authenticated_user.role == UserRole.ADMIN and new_user_role == UserRole.OWNER:
            # un admin no puede crear un owner, solo un owner puede crear otro owner
            raise UnauthorizedException(cast(int, authenticated_user.user_id), authenticated_user.role.value,
                                        new_user_role)
        # un owner puede crear lo que quiera, asi que no hay necesidad de validar nada más en ese caso
