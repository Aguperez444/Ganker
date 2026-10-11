from app.domain.models.team_member_role import TeamMemberRole
from app.domain.models.team_role_enum import TeamRoleEnum
from app.infrastructure.database.models.team_member_role_orm import TeamMemberRoleORM
from app.infrastructure.database.mappers.user_mapper import UserMapper
from app.infrastructure.database.mappers.role_mapper import RoleMapper

class TeamMemberRoleMapper:

    @staticmethod
    def orm_to_domain(team_member_role_orm: TeamMemberRoleORM) -> TeamMemberRole:
        return TeamMemberRole(
            team_member_role_id = team_member_role_orm.team_member_role_id,
            team_role= TeamRoleEnum(team_member_role_orm.team_role_id),
            team_id = team_member_role_orm.team_id,
            user = UserMapper.orm_to_domain(team_member_role_orm.user) if team_member_role_orm.user else None,
            game_role=RoleMapper.orm_to_domain(team_member_role_orm.game_role)
        )

    @staticmethod
    def domain_to_orm(team_member_role: TeamMemberRole) -> TeamMemberRoleORM:
        if not team_member_role.is_persisted():
            return TeamMemberRoleORM(
                team_role_id = team_member_role.team_role,
                team_id = team_member_role.team_id,
                game_role_id= team_member_role.game_role.role_id,
                user_id = team_member_role.user.user_id if team_member_role.user and team_member_role.user.is_persisted() else None
            )
        return TeamMemberRoleORM(
            team_member_role_id = team_member_role.team_member_role_id,
            team_role_id = team_member_role.team_role,
            game_role_id = team_member_role.game_role.role_id,
            team_id = team_member_role.team_id,
            user_id = team_member_role.user.user_id if team_member_role.user and team_member_role.user.is_persisted() else None
        )
