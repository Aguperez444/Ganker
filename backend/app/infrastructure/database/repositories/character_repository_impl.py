from typing import TYPE_CHECKING, Optional

from sqlalchemy import func
from app.application.ports.i_character_repository import ICharacterRepository
from app.infrastructure.database.mappers.character_mapper import CharacterMapper
from app.infrastructure.database.models.character_orm import CharacterORM

if TYPE_CHECKING:
    from app.domain.models.character import Character

class CharacterRepositoryImpl(ICharacterRepository):
    def __init__(self, session):
        self.session = session

    def get_character_by_id(self, character_id: int) -> Optional['Character']:
        found = self.session.query(CharacterORM).filter(
            CharacterORM.character_id == character_id,
            CharacterORM.deleted == False,
        ).first()
        if found and found.videogame and getattr(found.videogame, "deleted", False):
            return None
        domain_found = CharacterMapper.orm_to_domain(found) if found else None
        return domain_found

    def get_characters_by_game_id(self, game_id: int) -> list['Character']:
        found = self.session.query(CharacterORM).filter(
            CharacterORM.videogame_id == game_id,
            CharacterORM.deleted == False,
        ).all()
        domain_found = [
            CharacterMapper.orm_to_domain(character)
            for character in found
            if not (character.videogame and getattr(character.videogame, "deleted", False))
        ]
        return domain_found

    def get_character_by_name_and_videogame(self, name: str, videogame_id: int) -> Optional['Character']:
        found = self.session.query(CharacterORM).filter(
            func.lower(CharacterORM.name) == func.lower(name.strip()),
            CharacterORM.videogame_id == videogame_id,
            CharacterORM.deleted == False,
        ).first()
        if found and found.videogame and getattr(found.videogame, "deleted", False):
            return None
        domain_found = CharacterMapper.orm_to_domain(found) if found else None
        return domain_found

    def create_character(self, character: 'Character') -> 'Character':
        orm_character = CharacterMapper.domain_to_orm(character)
        self.session.add(orm_character)
        self.session.flush()
        self.session.refresh(orm_character)
        return CharacterMapper.orm_to_domain(orm_character)

    def update_character(self, character: 'Character') -> 'Character':
        orm_character = self.session.query(CharacterORM).filter(
            CharacterORM.character_id == character.character_id,
            CharacterORM.deleted == False,
        ).first()
        if orm_character:
            orm_character.name = character.name
            orm_character.videogame_id = character.videogame.videogame_id
            orm_character.icon_url = character.icon_url
            self.session.flush()
            self.session.refresh(orm_character)
            return CharacterMapper.orm_to_domain(orm_character)
        return character

    def delete_character(self, character_id: int) -> bool:
        orm_character = self.session.query(CharacterORM).filter(CharacterORM.character_id == character_id).first()
        if orm_character:
            self.session.delete(orm_character)
            self.session.flush()
            return True
        return False

    def soft_delete_character(self, character_id: int) -> bool:
        orm_character = self.session.query(CharacterORM).filter(
            CharacterORM.character_id == character_id,
            CharacterORM.deleted == False,
        ).first()
        if not orm_character:
            return False
        orm_character.deleted = True
        self.session.flush()
        return True

    def soft_delete_by_videogame_id(self, videogame_id: int) -> int:
        updated = self.session.query(CharacterORM).filter(
            CharacterORM.videogame_id == videogame_id,
            CharacterORM.deleted == False,
        ).update({CharacterORM.deleted: True}, synchronize_session='fetch')
        self.session.flush()
        return updated