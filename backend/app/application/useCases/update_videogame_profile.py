from typing import TYPE_CHECKING

from typing import cast
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.update_videogame_profile_request import UpdateGameProfileRequest
from exceptions.rank.rank_not_found_exception import RankNotFoundException
from exceptions.role.role_not_found_exception import RoleNotFoundException
from exceptions.character.character_not_found_exception import CharacterNotFoundException
from exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from exceptions.does_not_belong_to_game_exception import DoesNotBelongToGameException
from exceptions.game_profile.does_not_belong_to_profile_exception import DoesNotBelongToProfileException
from app.domain.services.create_game_profile_dto_service import CreateGameProfileDTOService


from app.domain.models.role_profile import RoleProfile
from app.domain.models.game_profile import GameProfile
from app.infrastructure.api.dto.update_videogame_profile_response import UpdateGameProfileResponse
from models.character_priority import CharacterPriority

if TYPE_CHECKING:
    from app.domain.models.role import Role
    from app.domain.models.rank import Rank

class UpdateVideogameProfile:
    
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work


    def execute(self, player_id: int, game_profile_id: int, update_videogame_profile_request: UpdateGameProfileRequest) -> UpdateGameProfileResponse:

        # Buscar el perfil en la BD y validar que pertenezca al jugador
        game_profile = self.validate_and_get_game_profile(game_profile_id, player_id)

        # Buscar y validar los personajes en la base de datos
        characters_priority = []
        with self.uow as uow:
            for index, character_id in enumerate(update_videogame_profile_request.character_ids, start=1):
                character = uow.character_repo.get_character_by_id(character_id)
                if not character:
                    raise CharacterNotFoundException(character_id)
                if character.videogame.videogame_id != game_profile.videogame.videogame_id:
                    raise DoesNotBelongToGameException("personaje", f"{character.name}", f"{game_profile.videogame.name}")

                characters_priority.append(CharacterPriority(priority_id=None, character=character, priority=index))


        # Buscar roles/rangos y crear las nuevas relaciones role_profile
        new_role_profiles: list[RoleProfile] = []
        for role_rank in update_videogame_profile_request.roles_ranks:
            role: Role = self.validate_role_exist(role_rank.role_id)
            rank: Rank = self.validate_rank_exist(role_rank.rank_id)

            # Validar que correspondan al videojuego (Criterio de aceptación)
            self.validate_belongs_to_videogame(role, rank, cast(int, game_profile.videogame.videogame_id))

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
        with self.uow as uow:
            updated_game_profile = uow.game_profile_repo.update_game_profile(game_profile)

        # crear el response object correspondiente #TODO REVISAR, ESTO PUEDE QUE SE REPLIQUE EN VARIOS LADOS Y TOQUE HACERLO UN SERVICE PARA NO DUPLICAR CODIGO

        response = CreateGameProfileDTOService.create_game_profile(updated_game_profile)
        return response


    def validate_and_get_game_profile(self, game_profile_id: int, player_id: int) -> GameProfile:
        with self.uow as uow:
            game_profile = uow.game_profile_repo.get_game_profile_by_id(game_profile_id)
            if not game_profile:
                raise GameProfileNotFoundException(game_profile_id)

            # Validar por seguridad que el jugador solo modifique sus propios perfiles
            if game_profile.player_id != player_id:
                raise DoesNotBelongToProfileException("perfil de juego", f"{game_profile_id}")

            return game_profile

    def validate_role_exist(self, role_id: int) -> 'Role':
        with self.uow as uow:
            role = uow.role_repo.get_role_by_id(role_id)
            if not role:
                raise RoleNotFoundException(role_id)
            return role

    def validate_rank_exist(self, rank_id: int) -> 'Rank':
        with self.uow as uow:
            rank = uow.rank_repo.get_rank_by_id(rank_id)
            if not rank:
                raise RankNotFoundException(rank_id)
            return rank

    @staticmethod
    def validate_belongs_to_videogame(role: 'Role', rank: 'Rank', videogame_id: int):
        if role.videogame.videogame_id != videogame_id:
            raise DoesNotBelongToGameException("rol", f'{role.name}', f'{role.videogame.name}')

        if rank.videogame.videogame_id != videogame_id:
            raise DoesNotBelongToGameException("rango", f'{rank.name}', f'{rank.videogame.name}')
