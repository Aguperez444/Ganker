from app.application.ports.i_unit_of_work import IUnitOfWork

from app.infrastructure.api.dto.character_object_response import CharacterObjectResponse
from app.infrastructure.api.dto.get_characters_response import GetCharactersResponse


class QueryCharacters:
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def get_by_game_id(self, game_id: int) -> GetCharactersResponse:
        with self.uow as uow:
            characters = uow.character_repo.get_characters_by_game_id(game_id)

        characters_response = [CharacterObjectResponse(character_id=character.character_id, name=character.name) for character in characters]

        return GetCharactersResponse(characters=characters_response)


