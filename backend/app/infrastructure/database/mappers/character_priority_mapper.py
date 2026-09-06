from app.domain.models.character_priority import CharacterPriority
from app.infrastructure.database.mappers.character_mapper import CharacterMapper
from app.infrastructure.database.models.character_priority_orm import CharacterPriorityORM



class CharacterPriorityMapper:
    @staticmethod
    def orm_to_domain(character_priority_orm: CharacterPriorityORM) -> CharacterPriority:
        return CharacterPriority(
            priority_id=character_priority_orm.character_priority_id,
            character=CharacterMapper.orm_to_domain(character_priority_orm.character),
            priority=character_priority_orm.priority
        )

    @staticmethod
    def domain_to_orm(character_priority_domain: CharacterPriority) -> CharacterPriorityORM:
        return CharacterPriorityORM(
            character_priority_id=character_priority_domain.priority_id,
            character_id=character_priority_domain.character.character_id,
            priority=character_priority_domain.priority
        )