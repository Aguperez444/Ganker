from typing import TYPE_CHECKING

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.create_videogame_profile_request import CreateGameProfileRequest
from exceptions.character_not_found_exception import CharacterNotFoundException
from exceptions.game_profile_already_exist_exception import GameProfileAlreadyExistException
from exceptions.rank_not_found_exception import RankNotFoundException
from exceptions.role_not_found_exception import RoleNotFoundException
from exceptions.videogame_not_found_exception import VideogameNotFoundException
from models.videogame import Videogame

if TYPE_CHECKING:
    from models.game_profile import GameProfile
    from models.role_profile import RoleProfile
    from models.role import Role
    from models.rank import Rank


class CreateVideogameProfile:

    # Recibo videogame_id, list[characters_id], list[roles] (cada role tiene role_id y rank_id) y un unite_of_works
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self, player_id: int, create_videogame_profile_request: CreateGameProfileRequest) -> GameProfile:

        # Buscar el videojuego en la base de datos
        videogame = self.validate_exist_videogame(create_videogame_profile_request.videogame_id)
        self.validate_not_exist_game_profile(player_id, videogame.videogame_id)

        # Buscar los personajes en la base de datos
        characters = []
        for character_id in create_videogame_profile_request.character_ids:
            character = self.uow.character_repo.get_character_by_id(character_id)
            if not character:
                raise CharacterNotFoundException(character_id)
            characters.append(character)

        # Busco los roles y rangos en la base de datos y creo el role_profile
        new_role_profiles: list[RoleProfile] = []
        for new_role_profile in create_videogame_profile_request.roles:

            role: Role = self.validate_role_exist(new_role_profile.role_id)
            rank: Rank = self.validate_rank_exist(new_role_profile.rank_id)

            role_profile: RoleProfile = RoleProfile(
                role_profile_id=None,
                role=role,
                rank=rank
            )

            new_role_profiles.append(role_profile)

        # Creo el game_profile
        new_game_profile: GameProfile = GameProfile(
            game_profile_id = None,
            videogame = videogame,
            characters = characters,
            role_profiles = new_role_profiles
        )

        # Persisto el game_profile en la base de datos
        with self.uow as uow:
            new_game_profile = uow.game_profile_repo.create_game_profile(new_game_profile)

        return new_game_profile

    def validate_exist_videogame(self, videogame_id: int) -> Videogame:
        with self.uow as uow:
            # 1. Validar que el videojuego exista
            videogame = uow.videogame_repo.get_videogame_by_id(videogame_id)
            if not videogame:
                raise VideogameNotFoundException(videogame_id)
            return videogame

    def validate_not_exist_game_profile(self, player_id: int, videogame_id: int) -> bool:
        # 2. Validar que el jugador no tenga ya un perfil registrado para este videojuego
        with self.uow as uow:
            existing_profile = uow.game_profile_repo.get_game_profile_by_player_and_videogame(player_id, videogame_id)
        if existing_profile:
            raise GameProfileAlreadyExistException(player_id, videogame_id)
        return True

    def validate_role_exist(self, role_id: int) -> Role:
        with self.uow as uow:
            role = uow.role_repo.get_role_by_id(role_id)
            if not role:
                raise RoleNotFoundException(role_id)
            return role
    def validate_rank_exist(self, rank_id: int) -> Rank:
        with self.uow as uow:
            rank = uow.rank_repo.get_rank_by_id(rank_id)
            if not rank:
                raise RankNotFoundException(rank_id)
            return rank