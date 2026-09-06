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

    def get_character_by_name_and_videogame(self, name: str, videogame_id: int) -> Optional['Character']:
        found = self.session.query(CharacterORM).filter(CharacterORM.name == name, CharacterORM.videogame_id == videogame_id).first()
        domain_found = CharacterMapper.orm_to_domain(found) if found else None
        return domain_found

    def create_character(self, character: 'Character') -> 'Character':
        orm_character = CharacterMapper.domain_to_orm(character)
        self.session.add(orm_character)
        self.session.flush()
        self.session.refresh(orm_character)
        return CharacterMapper.orm_to_domain(orm_character)

    def update_character(self, character: 'Character') -> 'Character':
        orm_character = self.session.query(CharacterORM).filter(CharacterORM.character_id == character.character_id).first()
        if orm_character:
            orm_character.name = character.name
            orm_character.videogame_id = character.videogame.videogame_id
            orm_character.icon_url = character.icon_url
            self.session.flush()
            self.session.refresh(orm_character)
        return CharacterMapper.orm_to_domain(orm_character)