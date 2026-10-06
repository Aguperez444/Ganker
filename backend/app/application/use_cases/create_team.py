from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.models.conversation_member_role_enum import ConversationMemberRoleEnum
from app.domain.models.team import Team
from app.domain.models.team_member_role import TeamMemberRole
from app.domain.models.conversation import Conversation
from app.domain.models.conversation_member import ConversationMember
from app.domain.models.conversation_type_enum import ConversationTypeEnum
from app.domain.models.team_role_enum import TeamRoleEnum
from app.domain.exceptions.team.invalid_rank_exception import InvalidrankException
from app.domain.exceptions.team.user_already_in_team_exception import UserAlreadyInTeamException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.exceptions.team.invalid_role_profile_exception import InvalidRoleProfileException
from app.domain.exceptions.team.InvalidRegionException import InvalidRegionException
from app.domain.exceptions.team.invalid_rank_range_exception import InvalidRankRangeException
from app.domain.exceptions.team.catalog_item_videogame_mismatch_exception import CatalogItemVideogameMismatchException
from app.domain.exceptions.file.file_name_not_null_exception import FileNameNotNullException

from typing import TYPE_CHECKING, Optional, BinaryIO
from app.domain.services.create_team_summary_service import CreateTeamSummaryService
from app.infrastructure.api.dto.request.create_team_request import CreateTeamRequest

if TYPE_CHECKING:
    from app.infrastructure.api.dto.response.team_summary import TeamSummaryResponse

class CreateTeam:
    def __init__(self, uow: IUnitOfWork, storage_service: IStorageService):
        self._uow = uow
        self.storage_service: IStorageService = storage_service

    def execute(
        self,
        user_id: int,
        request: CreateTeamRequest,
        icon_file: Optional[BinaryIO] = None,
        icon_filename: Optional[str] = None,
    ) -> 'TeamSummaryResponse':
        with self._uow as uow:
            # obtener el usuario, videojuego, rango mínimo y rango máximo del equipo y validar que existan
            current_user = CatalogValidationService.get_and_validate_exist_user(user_id, uow)
            videogame = CatalogValidationService.get_and_validate_exist_videogame(request.videogame_id, uow)
            min_rank = CatalogValidationService.get_and_validate_exist_rank(request.min_rank_id, uow)
            max_rank = CatalogValidationService.get_and_validate_exist_rank(request.max_rank_id, uow)

            # tiene que estar declarado para poder usarlo después sin que de error, pero, si el id es none, conviene no buscarlo en bdd
            region = None
            if request.region_id is not None:
                # si se nos pasó un ID de región, validar que exista y obtener la región
                region = CatalogValidationService.get_and_validate_exist_region(request.region_id, uow)

            # Los rangos deben pertenecer al videojuego del equipo
            for rank in (min_rank, max_rank):
                if rank.videogame != videogame:
                    raise CatalogItemVideogameMismatchException("rango", rank.rank_id, videogame.videogame_id)

            # validar que el rango mínimo no sea mayor al rango máximo (lógico)
            if min_rank.value > max_rank.value: # está totalmente permitido que el minimo y el maximo sean iguales (osea se permite un solo rango en ese team)
                raise InvalidRankRangeException(min_rank.value, max_rank.value)

            # Revisar si el usuario ya pertenece a un equipo activo
            if uow.team_repo.is_user_in_any_active_team(user_id):
                raise UserAlreadyInTeamException(user_id)

            # obtener el perfil de juego del usuario para el videojuego especificado
            user_game_profile = current_user.get_game_profile_by_videogame(videogame)
            if not user_game_profile:
                raise GameProfileNotFoundException(None, user_id, videogame.videogame_id)

            #  Validar la región del perfil de juego del usuario con la región del equipo
            if not request.allow_other_regions and region is not None:
                player_region = user_game_profile.region
                if player_region is None or player_region.region_id != region.region_id:
                    raise InvalidRegionException(region.region_id, player_region.region_id if player_region else None)


            creator_role = CatalogValidationService.get_and_validate_exist_role(request.creator_game_role_id, uow)
            # verificar que el rol del creador pertenezca al mismo videojuego del equipo
            if creator_role.videogame != videogame:
                raise CatalogItemVideogameMismatchException("rol", creator_role.role_id, videogame.videogame_id)

            # obtener el perfil de rol del usuario para el rol especificado y validar que exista
            creator_role_profile = user_game_profile.get_role_profile_by_role(creator_role)
            if not creator_role_profile:
                raise InvalidRoleProfileException(creator_role.role_id, user_game_profile.game_profile_id)

            # Validar el rango del perfil de juego del usuario con el rango mínimo y máximo del equipo
            if creator_role_profile.rank.value < min_rank.value or creator_role_profile.rank.value > max_rank.value:
                raise InvalidrankException(0, creator_role_profile.rank.rank_id, creator_role_profile.rank.value, min_rank.value, max_rank.value)

            # crear el miembro de la conversación para el creador del equipo (será el admin del chat)
            conv_member = ConversationMember(
                conversation_member_id=None,
                conversation_id=None,
                user=current_user,
                role=ConversationMemberRoleEnum.ADMIN
            )
            # Crear la conversación del equipo
            conversation = Conversation(
                conversation_id=None,
                members=[conv_member],
                messages=[],
                conversation_type=ConversationTypeEnum.GROUP,
                name=f"Chat del equipo {request.name}",
            )

            team_members = []
            
            # Crear el primer miembro (Owner)
            # noinspection bad-argument-type
            creator_member = TeamMemberRole(
                team_member_role_id=None,
                team_role=TeamRoleEnum.OWNER,
                team_id=None, # Se encarga el orm
                user=current_user,
                game_role=creator_role
            )
            team_members.append(creator_member)

            # 2. Crear los miembros vacantes (Vacancies)
            for role_id in request.vacant_game_role_ids:
                # obtenemos el rol de juego y validamos que exista y que pertenezca al mismo videojuego del equipo
                game_role = CatalogValidationService.get_and_validate_exist_role(role_id, uow)
                if game_role.videogame != videogame:
                    raise CatalogItemVideogameMismatchException("rol", game_role.role_id, videogame.videogame_id)
                # creamos el miembro vacante (sin usuario asignado) y lo agregamos a la lista de miembros del equipo
                # noinspection bad-argument-type
                vacancy = TeamMemberRole(
                    team_member_role_id=None,
                    team_role=TeamRoleEnum.MEMBER,
                    team_id=None, # se encarga el orm
                    user=None,
                    game_role=game_role
                )
                team_members.append(vacancy)

            # recién en este punto, que es cuando ya validamos lo necesario y sabemos que el equipo puede crearse
            # se trabaja la imagen del equipo que es la tarea más pesada
            if icon_file:
                if not icon_filename:
                    raise FileNameNotNullException()
                try:
                    # Guardo la nueva imagen a través del puerto
                    new_icon_url = self.storage_service.save_image_file(
                        file_content=icon_file,
                        filename=icon_filename,
                        subfolder=f"teams/icons",
                        preserve_original_name=False
                    )
                except Exception as e:
                    # Si hay un error al subir la imagen, se lanza una excepción
                    raise Exception(f"Error inesperado al subir la nueva imagen del equipo: {str(e)}")
            else:
                new_icon_url = None


            new_team = Team(
                team_id=None,
                name=request.name,
                description=request.description,
                icon_url=new_icon_url,
                is_active=True,
                allow_other_regions=request.allow_other_regions,
                videogame=videogame,
                region=region,
                min_rank=min_rank,
                max_rank=max_rank,
                conversation=conversation,
                members=team_members
            )

            created_team = uow.team_repo.create_team(new_team)

            return CreateTeamSummaryService.create_team_summary(created_team, viewer=current_user)
