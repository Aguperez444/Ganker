from typing import TYPE_CHECKING, cast, Optional

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.create_videogame_profile_request import CreateGameProfileRequest
from app.domain.exceptions.character.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.does_not_belong_to_game_exception import DoesNotBelongToGameException
from app.domain.exceptions.game_profile.game_profile_already_exist_exception import GameProfileAlreadyExistException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.role.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException

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
            videogame: 'Videogame' = self.get_and_validate_exist_videogame(create_videogame_profile_request.videogame_id, uow)
            self.validate_not_duplicated_game_profile(player_id, cast(int, videogame.videogame_id), uow)

            # Buscar los personajes en la base de datos
            characters: list['Character'] = []
            for character_id in create_videogame_profile_request.character_ids:
                character: Optional['Character'] = uow.character_repo.get_character_by_id(character_id)
                if not character:
                    raise CharacterNotFoundException(character_id)
                if character.videogame != videogame:
                    raise DoesNotBelongToGameException("personaje", character.name, videogame.name)
                characters.append(character)

            # Busco los roles y rangos en la base de datos y creo el role_profile
            new_role_profiles: list[RoleProfile] = []
            for new_role_profile in create_videogame_profile_request.roles:
                # Busco el rol y el rango en la base de datos y válido que existan
                role: 'Role' = self.get_role_and_validate_exist(new_role_profile.role_id, uow)
                rank: 'Rank' = self.get_rank_and_validate_exist(new_role_profile.rank_id, uow)

                # válido que el rol y el rango pertenezcan al videojuego
                if role.videogame != videogame:
                    raise DoesNotBelongToGameException("rol", role.name, videogame.name)
                if rank.videogame != videogame:
                    raise DoesNotBelongToGameException("rango", rank.name, videogame.name)

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

    @staticmethod
    def get_and_validate_exist_videogame(videogame_id: int, uow: IUnitOfWork) -> 'Videogame':
        """
        busca el videojuego en la base de datos y válida que exista. Si no existe, lanza una excepción VideogameNotFoundException.
        """
        # 1. Validar que el videojuego exista
        videogame = uow.videogame_repo.get_videogame_by_id(videogame_id)
        if not videogame:
            raise VideogameNotFoundException(videogame_id)
        return videogame

    @staticmethod
    def validate_not_duplicated_game_profile(player_id: int, videogame_id: int, uow: IUnitOfWork):
        """
         válida que el jugador no tenga ya un perfil registrado para este videojuego. Si ya tiene un perfil,
         lanza una excepción GameProfileAlreadyExistException.
        """
        # 2. Validar que el jugador no tenga ya un perfil registrado para este videojuego
        existing_profile = uow.game_profile_repo.get_game_profile_by_player_and_videogame(player_id, videogame_id)
        if existing_profile:
            raise GameProfileAlreadyExistException(player_id, videogame_id)
    @staticmethod
    def get_role_and_validate_exist(role_id: int, uow: IUnitOfWork) -> 'Role':
        """
        busca el rol en la base de datos y válida que exista. Si no existe, lanza una excepción RoleNotFoundException.
        """
        role = uow.role_repo.get_role_by_id(role_id)
        if not role:
            raise RoleNotFoundException(role_id)
        return role
    @staticmethod
    def get_rank_and_validate_exist(rank_id: int, uow: IUnitOfWork) -> 'Rank':
        """
        busca el rango en la base de datos y válida que exista. Si no existe, lanza una excepción RankNotFoundException.
        """
        rank = uow.rank_repo.get_rank_by_id(rank_id)
        if not rank:
            raise RankNotFoundException(rank_id)
        return rank