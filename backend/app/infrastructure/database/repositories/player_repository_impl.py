from app.application.ports.i_player_repository import IPlayerRepository
from sqlalchemy.orm import Session

from typing import TYPE_CHECKING, Optional

from app.infrastructure.database.mappers.player_mapper import PlayerMapper
from app.infrastructure.database.models.player_orm import PlayerORM

if TYPE_CHECKING:
    from app.domain.models.player import Player


class PlayerRepositoryImpl(IPlayerRepository):
    def __init__(self, session: Session):
        self.session: Session = session

    def create_player(self, user_data: 'Player') -> 'Player':
        orm_player = PlayerMapper.domain_to_orm(user_data)
        self.session.add(orm_player)
        self.session.flush()  # para obtener el player_id generado
        domain_player = PlayerMapper.orm_to_domain(orm_player)
        return domain_player

    def get_player_by_mail(self, mail) -> Optional['Player']:
        found = self.session.query(PlayerORM).filter(PlayerORM.mail == mail).first()
        domain_found = PlayerMapper.orm_to_domain(found) if found else None
        return domain_found

    def get_player_by_id(self, player_id: int) -> Optional['Player']:
        found = self.session.query(PlayerORM).filter(PlayerORM.player_id == player_id).first()
        domain_found = PlayerMapper.orm_to_domain(found) if found else None
        return domain_found


    def get_player_by_username(self, username: str) -> Optional['Player']:
        found = self.session.query(PlayerORM).filter(PlayerORM.username == username).first()
        domain_found = PlayerMapper.orm_to_domain(found) if found else None
        return domain_found

    def update_player(self, player: 'Player') -> 'Player':
        orm_player = self.session.query(PlayerORM).filter(PlayerORM.player_id == player.player_id).first()
        if orm_player:
            orm_player.name = player.name
            orm_player.username = player.username
            orm_player.mail = player.mail
            self.session.flush()
            self.session.refresh(orm_player)
            return PlayerMapper.orm_to_domain(orm_player)
        return player