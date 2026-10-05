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
            description = team_orm.description,
            allow_other_regions = team_orm.allow_other_regions,
            icon_url = team_orm.icon_url,
            is_active = team_orm.is_active,
            videogame = VideogameMapper.orm_to_domain(team_orm.videogame),
            region = RegionMapper.orm_to_domain(team_orm.region) if team_orm.region else None,
            min_rank = RankMapper.orm_to_domain(team_orm.min_rank), #TODO CHEQUEAR ESTO, QUE PASA SI YO BORRO UN RANGO? QUE PASO SI BORRO TODOS LOS RANGOS?
            max_rank = RankMapper.orm_to_domain(team_orm.max_rank),
            conversation = ConversationMapper.orm_to_domain(team_orm.conversation),
            members= [TeamMemberRoleMapper.orm_to_domain(mr) for mr in team_orm.members_roles] if team_orm.members_roles else []
        )

    @staticmethod
    def domain_to_orm(team: Team) -> TeamORM:
        if not team.is_persisted():
            orm_team = TeamORM(
                name = team.name,
                description = team.description,
                allow_other_regions = team.allow_other_regions,
                icon_url = team.icon_url,
                is_active = team.is_active,
                videogame_id = team.videogame.videogame_id,
                region_id = team.region.region_id if team.region and team.region.is_persisted() else None,
                min_rank_id = team.min_rank.rank_id,
                max_rank_id = team.max_rank.rank_id,
                conversation = ConversationMapper.domain_to_orm(team.conversation),
                members_roles= [TeamMemberRoleMapper.domain_to_orm(member) for member in team.members] if team.members else []
            )
        else:
            orm_team = TeamORM(
                team_id = team.team_id,
                name = team.name,
                description = team.description,
                allow_other_regions = team.allow_other_regions,
                icon_url = team.icon_url,
                is_active = team.is_active,
                videogame_id = team.videogame.videogame_id,
                region_id = team.region.region_id if team.region and team.region.is_persisted() else None,
                min_rank_id = team.min_rank.rank_id,
                max_rank_id = team.max_rank.rank_id,
                conversation = ConversationMapper.domain_to_orm(team.conversation),
                members_roles = [TeamMemberRoleMapper.domain_to_orm(member) for member in team.members] if team.members else []

            )

        if team.conversation.is_persisted():
            orm_team.conversation_id = team.conversation.conversation_id

        return orm_team
