from typing import TYPE_CHECKING, cast

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.request.create_videogame_profile_request import CreateGameProfileRequest

from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.services.game_profile_validation_service import GameProfileValidationService
from app.domain.models.role_profile import RoleProfile
from app.domain.models.game_profile import GameProfile
from app.domain.models.character_priority import CharacterPriority
from app.domain.exceptions.character.duplicated_character_in_request import DuplicatedCharacterInRequest
from app.domain.exceptions.role.duplicated_role_in_request import DuplicatedRoleInRequest

if TYPE_CHECKING:
    from app.domain.models.role import Role
    from app.domain.models.rank import Rank
    from app.domain.models.videogame import Videogame
    from app.domain.models.character import Character


class CreateVideogameProfile:

    # Recibo videogame_id, list[characters_id], list[roles] (cada role tiene role_id y rank_id) y un unite_of_works
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, player_id: int, create_videogame_profile_request: CreateGameProfileRequest) -> GameProfile:

        # validar que en la request no me vengan personajes duplicados
        if len(create_videogame_profile_request.character_ids) != len(set(create_videogame_profile_request.character_ids)):
            raise DuplicatedCharacterInRequest()
        # validar que en la request no me vengan roles duplicados
        role_ids = [role.role_id for role in create_videogame_profile_request.roles]
        if len(role_ids) != len(set(role_ids)):
            raise DuplicatedRoleInRequest()

        # Abrir sesión contra la bdd
        with self.uow as uow:
            # Buscar el videojuego en la base de datos
            videogame: 'Videogame' = CatalogValidationService.get_and_validate_exist_videogame(create_videogame_profile_request.videogame_id, uow)
            CatalogValidationService.validate_not_duplicated_game_profile(player_id, cast(int, videogame.videogame_id), uow)

            # Buscar los personajes en la base de datos
            characters: list['Character'] = []
            for character_id in create_videogame_profile_request.character_ids:
                character = CatalogValidationService.get_and_validate_exist_character(character_id, uow)
                GameProfileValidationService.validate_character_belongs_to_game(character, cast(int, videogame.videogame_id), videogame.name)
                characters.append(character)

            # Busco los roles y rangos en la base de datos y creo el role_profile
            new_role_profiles: list[RoleProfile] = []
            for new_role_profile in create_videogame_profile_request.roles:
                # Busco el rol y el rango en la base de datos y válido que existan
                role: 'Role' = CatalogValidationService.get_and_validate_exist_role(new_role_profile.role_id, uow)
                rank: 'Rank' = CatalogValidationService.get_and_validate_exist_rank(new_role_profile.rank_id, uow)

                # válido que el rol y el rango pertenezcan al videojuego
                GameProfileValidationService.validate_role_belongs_to_game(role, cast(int, videogame.videogame_id), videogame.name)
                GameProfileValidationService.validate_rank_belongs_to_game(rank, cast(int, videogame.videogame_id), videogame.name)

                # creo el role_profile y lo agrego a la lista de role_profiles
                role_profile: RoleProfile = RoleProfile(
                    role_profile_id=None,
                    role=role,
                    rank=rank
                )
                new_role_profiles.append(role_profile)

            # Creo la lista de CharacterPriority a partir de la lista de personajes, asignando prioridad según el orden del array.
            prioritized_characters = [CharacterPriority(priority_id=None,priority=index,character=char) for index, char in enumerate(characters, start=1)]
            # Creo el game_profile
            new_game_profile: GameProfile = GameProfile(
                game_profile_id = None,
                player_id = player_id,
                videogame = videogame,
                characters_priority = prioritized_characters,
                role_profiles = new_role_profiles
            )

            # Persisto el game_profile en la base de datos
            new_game_profile = uow.game_profile_repo.create_game_profile(new_game_profile)

        return new_game_profile


