from typing import TYPE_CHECKING, Optional

from app.application.ports.i_character_repository import ICharacterRepository
from app.infrastructure.database.mappers.character_mapper import CharacterMapper
from app.infrastructure.database.models.character_orm import CharacterORM

if TYPE_CHECKING:
    from app.domain.models.character import Character

class CharacterRepositoryImpl(ICharacterRepository):
    def __init__(self, session):
        self.session = session

    def get_character_by_id(self, character_id: int) -> Optional['Character']:
        found = self.session.query(CharacterORM).filter(CharacterORM.character_id == character_id).first()
        domain_found = CharacterMapper.orm_to_domain(found) if found else None
        return domain_found

    def get_characters_by_game_id(self, game_id: int) -> list['Character']:
        found = self.session.query(CharacterORM).filter(CharacterORM.videogame_id == game_id).all()
        domain_found = [CharacterMapper.orm_to_domain(character) for character in found]
        return domain_found