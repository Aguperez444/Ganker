from app.domain.models.character import Character
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.models.character_orm import CharacterORM


class CharacterMapper:
    @staticmethod
    def orm_to_domain(character_orm: CharacterORM) -> Character:
        return Character(
            character_id = character_orm.character_id,
            name = character_orm.name,
            videogame = VideogameMapper.orm_to_domain(character_orm.videogame),
            icon_url = character_orm.icon_url
        )

    @staticmethod
    def domain_to_orm(character: Character) -> CharacterORM:
        return CharacterORM(
            character_id = character.character_id,
            name = character.name,
            videogame_id = character.videogame.videogame_id,
            icon_url = character.icon_url
        )