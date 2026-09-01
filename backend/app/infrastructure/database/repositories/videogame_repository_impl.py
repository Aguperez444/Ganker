from typing import Optional, TYPE_CHECKING

from sqlalchemy import func
from sqlalchemy.orm import Session
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.models.videogame_orm import VideogameORM
from app.application.ports.i_videogame_repository import IVideogameRepository

if TYPE_CHECKING:
    from app.domain.models.videogame import Videogame


class VideogameRepositoryImpl(IVideogameRepository):
    def __init__(self, session: Session):
        self.session: Session = session

    def register_videogame(self, videogame: Videogame) -> 'Videogame':
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

        found = self.session.query(VideogameORM).filter(func.lower(VideogameORM.name) == videogame_name.lower()).first()
        domain_found = VideogameMapper.orm_to_domain(found) if found else None
        return domain_found

    def update_videogame(self, videogame: Videogame) -> 'Videogame':

        orm_videogame = self.session.query(VideogameORM).filter(VideogameORM.videogame_id == videogame.videogame_id).first()
        if orm_videogame:
            orm_videogame.name = videogame.name
            self.session.flush()
            self.session.refresh(orm_videogame)
            return VideogameMapper.orm_to_domain(orm_videogame)
        return videogame

    def get_all_videogames(self) -> list['Videogame']:
        orm_videogames = self.session.query(VideogameORM).all()
        domain_videogames = [VideogameMapper.orm_to_domain(v) for v in orm_videogames]
        return domain_videogames
