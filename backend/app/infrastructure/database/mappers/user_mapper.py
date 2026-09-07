from app.domain.models.user import User
from app.infrastructure.database.mappers.game_profile_mapper import GameProfileMapper
from app.infrastructure.database.models.user_orm import UserORM
from app.domain.models.user_role import UserRole


class UserMapper:
    @staticmethod
    def orm_to_domain(user_orm: UserORM) -> User:
        return User(
            user_id=user_orm.user_id,
            username=user_orm.username,
            name=user_orm.name,
            mail=user_orm.mail,
            password_hash=user_orm.password_hash,
            role=UserRole(user_orm.role),
            profiles = [GameProfileMapper.orm_to_domain(game_profile) for game_profile in user_orm.game_profiles],
            icon_url=user_orm.icon_url
        )

    @staticmethod
    def domain_to_orm(user_domain: User) -> UserORM:
        return UserORM(
            user_id=user_domain.user_id,
            username=user_domain.username,
            name=user_domain.name,
            mail=user_domain.mail,
            role=user_domain.role.value,
            password_hash=user_domain.password_hash,
            icon_url=user_domain.icon_url
        )