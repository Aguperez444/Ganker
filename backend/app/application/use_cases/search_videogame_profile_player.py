from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.request.Search_videogame_profiles_request import SearchVideogameProfilesRequest
from app.infrastructure.api.dto.response.get_videogame_profiles_response import GetVideogameProfilesResponse
from app.domain.specifications.base import Specification
from app.domain.specifications.videogame_profiles.characters_specification import ByCharactersSpecification
from app.domain.specifications.videogame_profiles.name_player_specification import ByNamePlayerSpecification
from app.domain.specifications.videogame_profiles.ranks_specification import ByRanksSpecification
from app.domain.specifications.videogame_profiles.roles_specification import ByRolesSpecification
from app.domain.specifications.videogame_profiles.videogame_specification import ByVideogameSpecification
from app.domain.specifications.videogame_profiles.different_player_id_specification import ByDifferentPlayerIDSpecification
from app.domain.specifications.videogame_profiles.last_connection_specification import ByLastConnectionSpecification


from app.domain.services.catalog_validation_service import CatalogValidationService


class SearchVideogameProfilePlayer:

    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow = unit_of_work

    # Objetivo de la US:
    # Buscar los perfiles de videojuegos de jugadores que cumplan con los filtros de manera paginada

    # 1 - Primero debo recibir los filtros aplicados desde un DTO
    # 2 - Los transformo a specs para armar el árbol/cascada de consultas
    # 3 - Hago la consulta

    def execute(self, filters: SearchVideogameProfilesRequest, player_id: int) -> GetVideogameProfilesResponse:
        with self.uow as uow:
            CatalogValidationService.get_and_validate_exist_videogame(filters.videogame_id, uow)

            # Siempre tengo que filtrar por un juego y tiempo de conexión
            specs: list[Specification] = [
                ByDifferentPlayerIDSpecification(player_id),
                ByVideogameSpecification(filters.videogame_id),
                ByLastConnectionSpecification(4)
            ]
            # Reviso si tengo más filtros
            if filters.roles:
                for role_id in filters.roles:
                    CatalogValidationService.get_and_validate_exist_role(role_id, uow)
                specs.append(ByRolesSpecification(filters.roles))
            if filters.ranks:
                for rank_id in filters.ranks:
                    CatalogValidationService.get_and_validate_exist_rank(rank_id, uow)
                specs.append(ByRanksSpecification(filters.ranks))
            if filters.characters:
                for character_id in filters.characters:
                    CatalogValidationService.get_and_validate_exist_character(character_id, uow)
                specs.append(ByCharactersSpecification(filters.characters))
            if filters.name and filters.name.strip() != "":
                specs.append(ByNamePlayerSpecification(filters.name))

            # Combino los filtros
            combined_spec = specs[0]
            for spec in specs[1:]:
                combined_spec = combined_spec & spec

            # Paginamos
            skip = (filters.page - 1) * filters.page_size if filters.page and filters.page >= 1 else 0
            limit = filters.page_size if filters.page_size else 5

            # Buscamos
            videogame_profiles = uow.find_by_specification_repo.get_videogame_profiles(combined_spec, skip, limit)

            return GetVideogameProfilesResponse(videogame_profiles=videogame_profiles)