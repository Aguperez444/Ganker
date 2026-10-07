from app.domain.models.team import Team
from app.infrastructure.database.models.team_orm import TeamORM
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.mappers.region_mapper import RegionMapper
from app.infrastructure.database.mappers.rank_mapper import RankMapper
from app.infrastructure.database.mappers.conversation_mapper import ConversationMapper
from app.infrastructure.database.mappers.team_member_role_mapper import TeamMemberRoleMapper

class TeamMapper:

    @staticmethod
    def orm_to_domain(team_orm: TeamORM) -> Team:
        return Team(
            team_id = team_orm.team_id,
            name = team_orm.name,
            allow_other_regions = team_orm.allow_other_regions,
            videogame = VideogameMapper.orm_to_domain(team_orm.videogame) if team_orm.videogame else None,
            region = RegionMapper.orm_to_domain(team_orm.region) if team_orm.region else None,
            min_rank = RankMapper.orm_to_domain(team_orm.min_rank) if team_orm.min_rank else None,
            max_rank = RankMapper.orm_to_domain(team_orm.max_rank) if team_orm.max_rank else None,
            conversation = ConversationMapper.orm_to_domain(team_orm.conversation) if team_orm.conversation else None,
            members= [TeamMemberRoleMapper.orm_to_domain(mr) for mr in team_orm.members_roles] if team_orm.members_roles else []
        )

    @staticmethod
    def domain_to_orm(team: Team) -> TeamORM:
        if not team.is_persisted():
            return TeamORM(
                name = team.name,
                allow_other_regions = team.allow_other_regions,
                videogame_id = team.videogame.videogame_id if team.videogame and team.videogame.is_persisted() else None,
                region_id = team.region.region_id if team.region and team.region.is_persisted() else None,
                min_rank_id = team.min_rank.rank_id if team.min_rank and team.min_rank.is_persisted() else None,
                max_rank_id = team.max_rank.rank_id if team.max_rank and team.max_rank.is_persisted() else None,
                conversation_id = team.conversation.conversation_id if team.conversation and team.conversation.is_persisted() else None
            )
        return TeamORM(
            team_id = team.team_id,
            name = team.name,
            allow_other_regions = team.allow_other_regions,
            videogame_id = team.videogame.videogame_id if team.videogame and team.videogame.is_persisted() else None,
            region_id = team.region.region_id if team.region and team.region.is_persisted() else None,
            min_rank_id = team.min_rank.rank_id if team.min_rank and team.min_rank.is_persisted() else None,
            max_rank_id = team.max_rank.rank_id if team.max_rank and team.max_rank.is_persisted() else None,
            conversation_id = team.conversation.conversation_id if team.conversation and team.conversation.is_persisted() else None
        )
