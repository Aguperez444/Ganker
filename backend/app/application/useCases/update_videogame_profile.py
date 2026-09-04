from typing import TYPE_CHECKING, cast

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.character_object_response import CharacterObjectResponse
from app.infrastructure.api.dto.rank_object_response import RankObjectResponse
from app.infrastructure.api.dto.role_object_response import RoleObjectResponse
from app.infrastructure.api.dto.role_profile_object_response import RoleProfileObjectResponse
from app.infrastructure.api.dto.update_videogame_profile_request import UpdateGameProfileRequest
from app.domain.exceptions.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.character_not_found_exception import CharacterNotFoundException
from app.domain.exceptions.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.exceptions.does_not_belong_to_game_exception import DoesNotBelongToGameException
from app.domain.exceptions.does_not_belong_to_profile_exception import DoesNotBelongToProfileException


from app.domain.models.role_profile import RoleProfile
from app.domain.models.game_profile import GameProfile
from app.infrastructure.api.dto.update_videogame_profile_response import UpdateGameProfileResponse
from app.infrastructure.api.dto.videogame_object_response import VideogameObjectResponse

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
        characters = []
        with self.uow as uow:
            for character_id in update_videogame_profile_request.character_ids:
                character = uow.character_repo.get_character_by_id(character_id)
                if not character:
                    raise CharacterNotFoundException(character_id)
                if character.videogame.videogame_id != game_profile.videogame.videogame_id:
                    raise DoesNotBelongToGameException("personaje", f"{character.name}")
                characters.append(character)


        # Buscar roles/rangos y crear las nuevas relaciones role_profile
        new_role_profiles: list[RoleProfile] = []
        for role_rank in update_videogame_profile_request.roles_ranks:
            role: Role = self.validate_role_exist(role_rank.role_id)
            rank: Rank = self.validate_rank_exist(role_rank.rank_id)

            # Validar que correspondan al videojuego (Criterio de aceptación)
            self.validate_belongs_to_videogame(role, rank, game_profile.videogame.videogame_id)

            role_profile: RoleProfile = RoleProfile(
                role_profile_id=None,  # Al ser una asignación nueva, el ORM genera el ID
                role=role,
                rank=rank
            )
            new_role_profiles.append(role_profile)

        # Actualizar la entidad de dominio con las nuevas listas
        game_profile.characters = characters
        game_profile.role_profiles = new_role_profiles

        # Persistir los cambios del perfil en la base de datos
        with self.uow as uow:
            updated_game_profile = uow.game_profile_repo.update_game_profile(game_profile)

        # crear el response object correspondiente #TODO REVISAR, ESTO PUEDE QUE SE REPLIQUE EN VARIOS LADOS Y TOQUE HACERLO UN SERVICE PARA NO DUPLICAR CODIGO
        response = UpdateGameProfileResponse(
            game_profile_id=cast(int, updated_game_profile.game_profile_id),
            player_id=updated_game_profile.player_id,
            videogame=VideogameObjectResponse(id=updated_game_profile.videogame.videogame_id, name=updated_game_profile.videogame.name),
            characters=[CharacterObjectResponse(character_id=character.character_id, name=character.name) for character in updated_game_profile.characters],
            role_profiles=[RoleProfileObjectResponse(
                role_profile_id=cast(int,role_profile.role_profile_id),
                role=RoleObjectResponse(role_id=role_profile.role.role_id, name=role_profile.role.name),
                rank=RankObjectResponse(
                    rank_id=cast(int, role_profile.rank.rank_id), name=role_profile.rank.name,
                    icon_url= role_profile.rank.icon_url, value=role_profile.rank.value)
            ) for role_profile in updated_game_profile.role_profiles]
        )
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
            raise DoesNotBelongToGameException("rol", f'{role.name}')

        if rank.videogame.videogame_id != videogame_id:
            raise DoesNotBelongToGameException("rango", f'{rank.name}')
