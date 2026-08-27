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

    def get_videogame_by_id(self, videogame_id: int) -> Optional['Videogame']:

        found = self.session.query(VideogameORM).filter(VideogameORM.videogame_id == videogame_id).first()
        domain_found = VideogameMapper.orm_to_domain(found) if found else None
        return domain_found