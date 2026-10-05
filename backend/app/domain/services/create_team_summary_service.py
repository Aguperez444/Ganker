from typing import TYPE_CHECKING, Optional

from app.domain.models.team_role_enum import TeamRoleEnum

from app.infrastructure.api.dto.response.team_summary import TeamSummaryResponse, UserSummaryResponse, \
    GameProfileSummaryResponse, RoleProfileSummaryResponse, RepresentativeRankResponse, JoinEligibilityResponse


if TYPE_CHECKING:
    from app.domain.models.team import Team
    from app.domain.models.team_member_role import TeamMemberRole
    from app.domain.models.user import User

DEFAULT_TEAM_ICON_URL = 'media/teams/icons/default_icon.png'


class CreateTeamSummaryService:

    @staticmethod
    def create_team_summary(team: 'Team', viewer: Optional['User'] = None,
                            viewer_in_other_team: bool = False) -> TeamSummaryResponse:
        """
        Arma el resumen de un equipo. Si se recibe el jugador que consulta (viewer), además se informa
        si es miembro/líder y si cumple los requisitos para unirse.
        """
        is_member = is_leader = join_eligibility = None
        if viewer is not None:
            is_member = team.has_member(viewer.user_id)
            is_leader = team.is_leader(viewer.user_id)
            join_eligibility = CreateTeamSummaryService._join_eligibility(team, viewer, viewer_in_other_team)

        conversation_id = team.conversation.conversation_id if team.conversation and team.conversation.is_persisted() else None

        return TeamSummaryResponse(
            team_id=team.team_id,
            team_name=team.name,
            description=team.description,
            icon_url=team.icon_url or DEFAULT_TEAM_ICON_URL,
            is_active=team.is_active,
            conversation_id=conversation_id,
            player_count=sum(member.user is not None for member in team.members),
            max_players=len(team.members),
            vacant_slots=len(team.vacant_slots()),
            representative_rank=CreateTeamSummaryService._representative_rank(team),
            is_member=is_member,
            is_leader=is_leader,
            join_eligibility=join_eligibility,
            videogame_id=team.videogame.videogame_id if getattr(team, 'videogame', None) else None,
            videogame_name=team.videogame.name if getattr(team, 'videogame', None) else None,
            region_id=team.region.region_id if getattr(team, 'region', None) else None,
            region_name=team.region.name if getattr(team, 'region', None) and team.region.name else 'Sin región',
            min_rank_id=team.min_rank.rank_id if getattr(team, 'min_rank', None) else None,
            min_rank_name=team.min_rank.name if getattr(team, 'min_rank', None) else None,
            min_rank_value=team.min_rank.value if getattr(team, 'min_rank', None) else None,
            max_rank_id=team.max_rank.rank_id if getattr(team, 'max_rank', None) else None,
            max_rank_name=team.max_rank.name if getattr(team, 'max_rank', None) else None,
            max_rank_value=team.max_rank.value if getattr(team, 'max_rank', None) else None,
            allow_other_regions=getattr(team, 'allow_other_regions', False),
            members=[
                CreateTeamSummaryService._map_member(member, team)
                for member in team.members
            ]
        )

    @staticmethod
    def _join_eligibility(team: 'Team', viewer: 'User', viewer_in_other_team: bool) -> JoinEligibilityResponse:
        if team.has_member(viewer.user_id):
            return JoinEligibilityResponse(can_join=False, reason="Ya sos miembro de este equipo")
        if viewer_in_other_team:
            return JoinEligibilityResponse(can_join=False, reason="Ya formás parte de otro equipo activo")
        rejection = team.get_join_rejection(viewer)
        if rejection is not None:
            return JoinEligibilityResponse(can_join=False, reason=rejection.message)
        return JoinEligibilityResponse(can_join=True)

    @staticmethod
    def _member_rank(member: 'TeamMemberRole', team: 'Team'):
        if member.user is None:
            return None
        profile = member.user.get_game_profile_by_videogame(team.videogame)
        role_profile = profile.get_role_profile_by_role(member.game_role) if profile else None
        return role_profile.rank if role_profile else None

    @staticmethod
    def _representative_rank(team: 'Team') -> Optional[RepresentativeRankResponse]:
        ranks = [r for r in (CreateTeamSummaryService._member_rank(m, team) for m in team.members) if r is not None]
        if not ranks:
            return None
        average = sum(r.value for r in ranks) / len(ranks)
        closest = min(ranks, key=lambda r: abs(r.value - average))
        return RepresentativeRankResponse(rank_id=closest.rank_id, name=closest.name,
                                          icon_url=closest.icon_url, average_value=average)

    @staticmethod
    def _map_member(member: 'TeamMemberRole', team: 'Team') -> UserSummaryResponse:
        slot_id = member.team_member_role_id if member.is_persisted() else None

        if member.user is None:
            # Slot Vacante
            return UserSummaryResponse(
                team_member_role_id=slot_id,
                is_vacant=True,
                is_leader=False,
                user_id=None,
                username='Libre',
                name='Libre',
                icon_url=member.game_role.icon_url,
                active_game_profile=GameProfileSummaryResponse(
                    region_name=team.region.name if getattr(team, 'region', None) and team.region.name else 'Sin región',
                    active_role_profile=RoleProfileSummaryResponse(
                        role_id=member.game_role.role_id if getattr(member, 'game_role', None) else None,
                        role_name=member.game_role.name,
                        rank_name='',
                        rank_icon_url='/media/ranks/empty_rank_icon.png'
                    )
                )
            )

        # Slot Ocupado (Calculamos en base al usuario de este slot específico)
        user_game_profile = member.user.get_game_profile_by_videogame(team.videogame)
        user_role_profile = user_game_profile.get_role_profile_by_role(member.game_role) if user_game_profile else None

        return UserSummaryResponse(
            team_member_role_id=slot_id,
            is_vacant=False,
            is_leader=member.team_role == TeamRoleEnum.OWNER,
            user_id=member.user.user_id,
            username=member.user.username,
            name=member.user.name,
            icon_url=member.user.icon_url,
            active_game_profile=GameProfileSummaryResponse(
                region_name=user_game_profile.region.name if user_game_profile and user_game_profile.region else 'Sin región',
                active_role_profile=RoleProfileSummaryResponse(
                    role_id=member.game_role.role_id if getattr(member, 'game_role', None) else None,
                    role_name=user_role_profile.role.name if user_role_profile else member.game_role.name,
                    rank_name=user_role_profile.rank.name if user_role_profile else '',
                    rank_icon_url=user_role_profile.rank.icon_url if user_role_profile else ''
                )
            )
        )
