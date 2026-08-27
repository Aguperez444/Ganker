from typing import Optional, TYPE_CHECKING

from sqlalchemy.orm import Session
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.models.videogame_orm import VideogameORM
from app.application.ports.i_videogame_repository import IVideogameRepository

if TYPE_CHECKING:
    from models.videogame import Videogame


class VideogameRepositoryImpl(IVideogameRepository):
    def __init__(self, session: Session):
        self.session: Session = session

    def register_videogame(self, videogame: VideogameORM) -> 'Videogame':
        orm_videogame = VideogameMapper.domain_to_orm(videogame)

        self.session.add(orm_videogame)
        self.session.flush()
        self.session.refresh(orm_videogame)
        domain_videogame = VideogameMapper.orm_to_domain(orm_videogame)
        return domain_videogame

    def get_videogame_by_id(self, videogame_id: int) -> Optional['Videogame']:

        found = self.session.query(VideogameORM).filter(VideogameORM.videogame_id == videogame_id).first()
        domain_found = VideogameMapper.orm_to_domain(found) if found else None
        return domain_found

    def get_videogame_by_name(self, videogame_name: str) -> Optional['Videogame']:
        found = self.session.query(VideogameORM).filter(VideogameORM.name == videogame_name).first()
        domain_found = VideogameMapper.orm_to_domain(found) if found else None
        return domain_found