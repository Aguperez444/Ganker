from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.infrastructure.api.dto.response.delete_character_response import DeleteCharacterResponse


class DeleteCharacter:
    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service: IStorageService = storage_service
        self.uow: IUnitOfWork = uow

    def execute(self, character_id: int) -> DeleteCharacterResponse:
        with self.uow as uow:
            character_to_delete = uow.character_repo.get_character_by_id(character_id)
            if not character_to_delete:
                raise CharacterNotFoundException(character_id)

            # Validar si existen jugadores o preferencias asociadas actualmente al personaje
            associated_count = uow.character_priority_repo.count_associated_to_character(character_id)
            if associated_count > 0:
                # Al eliminarse el personaje, reajustar los personajes por prioridad de los GameProfile
                # que lo referencien para no dejar huecos
                uow.character_priority_repo.delete_and_readjust_for_character(character_id)

            # Eliminar el personaje del sistema
            uow.character_repo.delete_character(character_id)

            # Limpiar archivo de ícono en almacenamiento si existe
            if character_to_delete.icon_url:
                self.storage_service.delete_file(character_to_delete.icon_url)

        return DeleteCharacterResponse(message="El personaje ha sido eliminado exitosamente.")
