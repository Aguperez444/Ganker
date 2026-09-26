from typing import TYPE_CHECKING, cast
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.request.update_videogame_profile_request import UpdateGameProfileRequest
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.game_profile_validation_service import GameProfileValidationService
from app.domain.services.create_game_profile_dto_service import CreateGameProfileDTOService

from app.domain.models.role_profile import RoleProfile
from app.infrastructure.api.dto.response.update_videogame_profile_response import UpdateGameProfileResponse
from app.domain.models.character_priority import CharacterPriority

if TYPE_CHECKING:
    from app.domain.models.role import Role
    from app.domain.models.rank import Rank

class UpdateVideogameProfile:
    
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, player_id: int, game_profile_id: int, update_videogame_profile_request: UpdateGameProfileRequest) -> UpdateGameProfileResponse:
        with self.uow as uow:
            # Buscar el perfil en la BD y validar que pertenezca al jugador
            game_profile = CatalogValidationService.validate_and_get_game_profile(game_profile_id, player_id, uow)
            vg_id = cast(int, game_profile.videogame.videogame_id)
            vg_name = game_profile.videogame.name

            # Buscar y validar los personajes en la base de datos
            characters_priority = []
            for index, character_id in enumerate(update_videogame_profile_request.character_ids, start=1):
                character = CatalogValidationService.get_character_and_validate_exist(character_id, uow)
                GameProfileValidationService.validate_character_belongs_to_game(character, vg_id, vg_name)
                characters_priority.append(CharacterPriority(priority_id=None, character=character, priority=index))

            # Buscar roles/rangos y crear las nuevas relaciones role_profile
            new_role_profiles: list[RoleProfile] = []
            for role_rank in update_videogame_profile_request.roles_ranks:
                role: Role = CatalogValidationService.get_role_and_validate_exist(role_rank.role_id, uow)
                rank: Rank = CatalogValidationService.get_rank_and_validate_exist(role_rank.rank_id, uow)

                # Validar que correspondan al videojuego por ID (Criterio de aceptación)
                GameProfileValidationService.validate_role_belongs_to_game(role, vg_id, vg_name)
                GameProfileValidationService.validate_rank_belongs_to_game(rank, vg_id, vg_name)

                role_profile: RoleProfile = RoleProfile(
                    role_profile_id=None,  # Al ser una asignación nueva, el ORM genera el ID
                    role=role,
                    rank=rank
                )
                new_role_profiles.append(role_profile)

            # Actualizar la entidad de dominio con las nuevas listas
            game_profile.characters_priority = characters_priority
            game_profile.role_profiles = new_role_profiles

            # Persistir los cambios del perfil en la base de datos
            updated_game_profile = uow.game_profile_repo.update_game_profile(game_profile)

        response = CreateGameProfileDTOService.create_update_game_profile(updated_game_profile)
        return response