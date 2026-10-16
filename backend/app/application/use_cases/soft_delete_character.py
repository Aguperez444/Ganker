from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.infrastructure.api.dto.response.delete.delete_character_response import DeleteCharacterResponse


class SoftDeleteCharacterUseCase:
    def __init__(self, uow: IUnitOfWork):
        self.uow: IUnitOfWork = uow

    def execute(self, character_id: int) -> DeleteCharacterResponse:
        with self.uow as uow:
            character_to_delete = uow.character_repo.get_character_by_id(character_id)
            if not character_to_delete:
                raise CharacterNotFoundException(character_id)

            associated_count = uow.character_priority_repo.count_associated_to_character(character_id)
            if associated_count > 0:
                uow.character_priority_repo.soft_delete_character(character_id)

            uow.character_repo.soft_delete_character(character_id)

        return DeleteCharacterResponse(message="El personaje ha sido eliminado exitosamente.")


SoftDeleteCharacter = SoftDeleteCharacterUseCase
