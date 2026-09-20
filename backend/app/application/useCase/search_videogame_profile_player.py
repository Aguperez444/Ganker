from typing import cast

from app.application.ports.i_find_by_specifications_service import IFindBySpecificationRepository
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.request.Search_videogame_profiles_request import SearchVideogameProfilesRequest
from app.infrastructure.api.dto.response.base_classes.character_object_response import CharacterObjectResponse
from app.infrastructure.api.dto.response.base_classes.game_profile_object_response import GameProfileObjectResponse
from app.infrastructure.api.dto.response.base_classes.rank_object_response import RankObjectResponse
from app.infrastructure.api.dto.response.base_classes.role_object_response import RoleObjectResponse
from app.infrastructure.api.dto.response.base_classes.role_profile_object_response import RoleProfileObjectResponse
from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse
from app.infrastructure.api.dto.response.get_videogame_profiles_response import GetVideogameProfilesResponse
from app.domain.specifications.base import Specification
from app.domain.specifications.videogame_profiles.characters_specification import ByCharactersSpecification
from app.domain.specifications.videogame_profiles.last_connection_specification import ByLastConnectionSpecification
from app.domain.specifications.videogame_profiles.name_player_specification import ByNamePlayerSpecification
from app.domain.specifications.videogame_profiles.ranks_specification import ByRanksSpecification
from app.domain.specifications.videogame_profiles.roles_specification import ByRolesSpecification
from app.domain.specifications.videogame_profiles.videogame_specification import ByVideogameSpecification


class SearchVideogameProfilePlayer:

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow = unit_of_work

    # Objetivo de la US:
    # Buscar los perfiles de videojuegos de jugadores que cumplan con los filtros de manera paginada

    # 1 - Primero debo recibir los filtros aplicados desde un DTO
    # 2 - Los transformo a specs para armar el árbol/cascada de consultas
    # 3 - Hago la consulta

    def execute(self, filters: SearchVideogameProfilesRequest) -> GetVideogameProfilesResponse:

        # Siempre tengo que filtrar por un juego y tiempo de conexión
        specs: list[Specification] = [ByVideogameSpecification(filters.videogame_id)]
        # TODO CUANDO EXISTA EL ATRIBUTO AGREGAR A LA LISTA ByLastConnectionSpecification(filters.last_connection)
        #Reviso si tengo más filtros
        if filters.roles:
            specs.append(ByRolesSpecification(filters.roles))
        if filters.ranks:
            specs.append(ByRanksSpecification(filters.ranks))
        if filters.characters:
            specs.append(ByCharactersSpecification(filters.characters))
        if filters.name:
            specs.append(ByNamePlayerSpecification(filters.name))
        if filters.name:
            specs.append(ByNamePlayerSpecification(filters.name))

        # Combino los filtros
        combined_spec = specs[0]
        for spec in specs[1:]:
            combined_spec = combined_spec & spec


       # Paginamos

        skip = ( filters.page - 1 ) * filters.page_size if filters.page > 1 else 0
        limit = filters.page_size if filters.page_size else 25

        # Buscamos
        with self.uow as uow:
            videogame_profiles = uow.find_by_specification_repo.get_videogame_profiles(combined_spec, skip,limit)
            videogame_profiles_response= [
                GameProfileObjectResponse(
                    game_profile_id = cast(int, videogame_profile.game_profile_id),
                    player_id = videogame_profile.player_id,
                    videogame = VideogameObjectResponse(
                        id = cast(int, videogame_profile.videogame.videogame_id),
                        name = videogame_profile.videogame.name,
                        icon_url= videogame_profile.videogame.icon_url,
                        rank_per_role=videogame_profile.videogame.rank_per_role,
                    ),
                    characters = [
                        CharacterObjectResponse(
                            character_id= cast(int, character_priority.character.character_id),
                            name= character_priority.character.name,
                            icon_url= character_priority.character.icon_url
                        )
                        for character_priority in videogame_profile.characters_priority
                    ],
                    role_profiles = [
                        RoleProfileObjectResponse(
                            role_profile_id=cast(int, role_profile.role_profile_id),
                            role= RoleObjectResponse(
                                role_id = cast(int,role_profile.role.role_id),
                                name= role_profile.role.name,
                                icon_url= role_profile.role.icon_url
                            ),
                            rank= RankObjectResponse(
                                rank_id= cast(int,role_profile.rank.rank_id),
                                name= role_profile.rank.name,
                                value= role_profile.rank.value,
                                icon_url= role_profile.rank.icon_url
                            )
                        )
                        for role_profile in videogame_profile.role_profiles
                    ]
                )
                for videogame_profile in videogame_profiles
            ]

            return GetVideogameProfilesResponse(videogame_profiles= videogame_profiles_response)

