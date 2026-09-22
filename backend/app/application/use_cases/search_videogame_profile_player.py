from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.request.Search_videogame_profiles_request import SearchVideogameProfilesRequest
from app.infrastructure.api.dto.response.get_videogame_profiles_response import GetVideogameProfilesResponse
from app.domain.specifications.base import Specification
from app.domain.specifications.videogame_profiles.characters_specification import ByCharactersSpecification
from app.domain.specifications.videogame_profiles.name_player_specification import ByNamePlayerSpecification
from app.domain.specifications.videogame_profiles.ranks_specification import ByRanksSpecification
from app.domain.specifications.videogame_profiles.roles_specification import ByRolesSpecification
from app.domain.specifications.videogame_profiles.videogame_specification import ByVideogameSpecification
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.domain.specifications.videogame_profiles.different_player_id_specification import ByDifferentPlayerIDSpecification
from app.domain.specifications.videogame_profiles.last_connection_specification import ByLastConnectionSpecification


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
            self.get_and_validate_exist_videogame(filters.videogame_id, uow=uow)

            # Siempre tengo que filtrar por un juego y tiempo de conexión
            specs: list[Specification] = [ByDifferentPlayerIDSpecification(player_id), ByVideogameSpecification(filters.videogame_id), ByLastConnectionSpecification(
                4)]
            # Reviso si tengo más filtros
            if filters.roles:
                for role in filters.roles:
                    self.get_and_validate_exist_videogame(role, uow=uow)
                specs.append(ByRolesSpecification(filters.roles))
            if filters.ranks:
                for rank in filters.ranks:
                    self.get_and_validate_exist_videogame(rank, uow=uow)
                specs.append(ByRanksSpecification(filters.ranks))
            if filters.characters:
                for character in filters.characters:
                    self.get_character_and_validate_exist(character, uow=uow)
                specs.append(ByCharactersSpecification(filters.characters))
            if filters.name and filters.name.strip() != "":
                specs.append(ByNamePlayerSpecification(filters.name))

            # Combino los filtros
            combined_spec = specs[0]
            for spec in specs[1:]:
                combined_spec = combined_spec & spec


       # Paginamos

        skip = ( filters.page - 1 ) * filters.page_size if filters.page and filters.page >= 1 else 0
        limit = filters.page_size if filters.page_size else 5

        # Buscamos
        with self.uow as uow:
            videogame_profiles = uow.find_by_specification_repo.get_videogame_profiles(combined_spec, skip,limit)

            return GetVideogameProfilesResponse(videogame_profiles= videogame_profiles)

    @staticmethod
    def get_and_validate_exist_videogame(videogame_id: int, uow: IUnitOfWork):
        """
        busca el videojuego en la base de datos y válida que exista. Si no existe, lanza una excepción VideogameNotFoundException.
        """
        # 1. Validar que el videojuego exista
        videogame = uow.videogame_repo.get_videogame_by_id(videogame_id)
        if not videogame:
            raise VideogameNotFoundException(videogame_id)

    @staticmethod
    def get_role_and_validate_exist(role_id: int, uow: IUnitOfWork):
        """
        busca el rol en la base de datos y válida que exista. Si no existe, lanza una excepción RoleNotFoundException.
        """
        role = uow.role_repo.get_role_by_id(role_id)
        if not role:
            raise RoleNotFoundException(role_id)

    @staticmethod
    def get_rank_and_validate_exist(rank_id: int, uow: IUnitOfWork):
        """
        busca el rango en la base de datos y válida que exista. Si no existe, lanza una excepción RankNotFoundException.
        """
        rank = uow.rank_repo.get_rank_by_id(rank_id)
        if not rank:
            raise RankNotFoundException(rank_id)

    @staticmethod
    def get_character_and_validate_exist(character_id: int, uow: IUnitOfWork):
        character = uow.character_repo.get_character_by_id(character_id)
        if not character:
            raise CharacterNotFoundException(character_id)
