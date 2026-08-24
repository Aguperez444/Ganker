from app.domain.models.character import Character
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.models.characterORM import CharacterORM


class CharacterMapper:
    @staticmethod
    def ORM_to_Domain(characterORM):
        return Character(
            character_id = characterORM.character_id,
            name = characterORM.name,
            videogame = VideogameMapper.ORM_to_Domain(characterORM.videogame)
        )

    @staticmethod
    def Domain_to_ORM(character):
        return CharacterORM(
            character_id = character.character_id,
            name = character.name,
            videogame_id = character.videogame.videogame_id
        )