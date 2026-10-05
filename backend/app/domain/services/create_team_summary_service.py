from app.infrastructure.api.dto.response.team_summary import TeamSummaryResponse, UserSummaryResponse, \
    GameProfileSummaryResponse, RoleProfileSummaryResponse

from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from app.domain.models.team import Team
    from app.domain.models.team_member_role import TeamMemberRole


class CreateTeamSummaryService:

    @staticmethod
    def create_team_summary(team: 'Team'):
        return TeamSummaryResponse(
            team_id=team.team_id,
            team_name=team.name,
            description=team.description,
            player_count=sum(member.user is not None for member in team.members),
            max_players=len(team.members),
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
    def _map_member(member: 'TeamMemberRole', team: 'Team') -> UserSummaryResponse:
        if member.user is None:
            # Slot Vacante
            return UserSummaryResponse(
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