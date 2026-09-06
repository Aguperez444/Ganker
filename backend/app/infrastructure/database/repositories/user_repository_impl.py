from app.application.ports.i_user_repository import IUserRepository
from sqlalchemy.orm import Session

from typing import TYPE_CHECKING, Optional

from app.infrastructure.database.mappers.user_mapper import UserMapper
from app.infrastructure.database.models.user_orm import UserORM

if TYPE_CHECKING:
    from app.domain.models.user import User


class UserRepositoryImpl(IUserRepository):
    def __init__(self, session: Session):
        self.session: Session = session

    def create_user(self, user_data: 'User') -> 'User':
        orm_user = UserMapper.domain_to_orm(user_data)
        self.session.add(orm_user)
        self.session.flush()  # para obtener el player_id generado
        domain_user = UserMapper.orm_to_domain(orm_user)
        return domain_user

    def get_user_by_mail(self, mail) -> Optional['User']:
        found = self.session.query(UserORM).filter(UserORM.mail == mail).first()
        domain_found = UserMapper.orm_to_domain(found) if found else None
        return domain_found

    def get_user_by_id(self, user_id: int) -> Optional['User']:
        found = self.session.query(UserORM).filter(UserORM.user_id == user_id).first()
        domain_found = UserMapper.orm_to_domain(found) if found else None
        return domain_found


    def get_user_by_username(self, username: str) -> Optional['User']:
        found = self.session.query(UserORM).filter(UserORM.username == username).first()
        domain_found = UserMapper.orm_to_domain(found) if found else None
        return domain_found

    def update_user(self, user: 'User') -> 'User':
        orm_user = self.session.query(UserORM).filter(UserORM.user_id == user.user_id).first()
        if orm_user:
            orm_user.name = user.name
            orm_user.username = user.username
            orm_user.mail = user.mail
            self.session.flush()
            self.session.refresh(orm_user)
            return UserMapper.orm_to_domain(orm_user)
        return user