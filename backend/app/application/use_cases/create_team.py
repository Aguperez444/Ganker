from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.models.conversation_member_role_enum import ConversationMemberRoleEnum
from app.domain.models.team import Team
from app.domain.models.team_member_role import TeamMemberRole
from app.domain.models.conversation import Conversation
from app.domain.models.conversation_member import ConversationMember
from app.domain.models.conversation_type_enum import ConversationTypeEnum
from app.domain.models.team_role_enum import TeamRoleEnum
from app.domain.exceptions.team.invalid_rank_exception import InvalidrankException
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.exceptions.game_profile.game_profile_not_found_exception import GameProfileNotFoundException
from app.domain.exceptions.team.invalid_role_profile_exception import InvalidRoleProfileException
from app.domain.exceptions.team.InvalidRegionException import InvalidRegionException

from typing import TYPE_CHECKING
from app.domain.services.create_team_summary_service import CreateTeamSummaryService
from app.infrastructure.api.dto.request.create_team_request import CreateTeamRequest

if TYPE_CHECKING:
    from app.infrastructure.api.dto.response.team_summary import TeamSummaryResponse

class CreateTeam:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, user_id: int, request: CreateTeamRequest) -> 'TeamSummaryResponse':
        with self._uow as uow:
            current_user = CatalogValidationService.get_and_validate_exist_user(user_id, uow)
            videogame = CatalogValidationService.get_and_validate_exist_videogame(request.videogame_id, uow)
            min_rank = CatalogValidationService.get_and_validate_exist_rank(request.min_rank_id, uow)
            max_rank = CatalogValidationService.get_and_validate_exist_rank(request.max_rank_id, uow)

            if request.region_id is not None:
                region = CatalogValidationService.get_and_validate_exist_region(request.region_id, uow)

            # TODO: Crear una exception para esto
            if min_rank.value > max_rank.value:
                raise ValueError("Rango mínimo no puede ser superior al máximo")

            # Revisar si el usuario ya pertenece a un equipo activo
            if uow.team_repo.is_user_in_any_active_team(user_id):
                raise ValueError("El usuario ya pertenece a un equipo activo") # TODO: Crear una exception para esto

            # obtener el perfil de juego del usuario para el videojuego especificado
            user_game_profile = current_user.get_game_profile_by_videogame(videogame)
            if not user_game_profile:
                raise GameProfileNotFoundException(None, user_id, videogame.videogame_id)

            #  Validar la región del perfil de juego del usuario con la región del equipo
            if not request.allow_other_regions and user_game_profile.region and user_game_profile.region.region_id != region.region_id:
                raise InvalidRegionException(region.region_id, user_game_profile.region.region_id)

            # Validar el rango del perfil de juego del usuario con el rango mínimo y máximo del equipo
            creator_role = CatalogValidationService.get_and_validate_exist_role(request.creator_game_role_id, uow)
            creator_role_profile = user_game_profile.get_role_profile_by_role(creator_role)
            if not creator_role_profile:
                raise InvalidRoleProfileException(creator_role.role_id, user_game_profile.game_profile_id)

            if creator_role_profile.rank.value < min_rank.value or creator_role_profile.rank.value > max_rank.value:
                raise InvalidrankException(0, creator_role_profile.rank.rank_id, creator_role_profile.rank.value, min_rank.value, max_rank.value)

            # Crear la conversación del equipo
            conv_member = ConversationMember(
                conversation_member_id=None,
                conversation_id=None,
                user=current_user,
                role=ConversationMemberRoleEnum.ADMIN
            )
            conversation = Conversation(
                conversation_id=None,
                members=[conv_member],
                messages=[],
                conversation_type=ConversationTypeEnum.GROUP,
                name=f"Chat del equipo {request.name}"
            )

            team_members = []
            
            # 1. Crear el primer miembro (Owner)
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
                game_role = CatalogValidationService.get_and_validate_exist_role(role_id, uow)
                vacancy = TeamMemberRole(
                    team_member_role_id=None,
                    team_role=TeamRoleEnum.MEMBER,
                    team_id=None,
                    user=None,
                    game_role=game_role
                )
                team_members.append(vacancy)

            new_team = Team(
                team_id=None,
                name=request.name,
                description=request.description,
                allow_other_regions=request.allow_other_regions,
                videogame=videogame,
                region=region,
                min_rank=min_rank,
                max_rank=max_rank,
                conversation=conversation,
                members=team_members
            )

            created_team = uow.team_repo.create_team(new_team)

            return CreateTeamSummaryService.create_team_summary(created_team)
