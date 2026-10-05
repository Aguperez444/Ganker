from app.domain.models.team_member_role import TeamMemberRole
from app.infrastructure.database.models.team_member_role_orm import TeamMemberRoleORM
from app.infrastructure.database.mappers.user_mapper import UserMapper

class TeamMemberRoleMapper:

    @staticmethod
    def orm_to_domain(team_member_role_orm: TeamMemberRoleORM) -> TeamMemberRole:
        return TeamMemberRole(
            team_member_role_id = team_member_role_orm.team_member_role_id,
            role = team_member_role_orm.role,
            team_id = team_member_role_orm.team_id,
            user = UserMapper.orm_to_domain(team_member_role_orm.user) if team_member_role_orm.user else None
        )

    @staticmethod
    def domain_to_orm(team_member_role: TeamMemberRole) -> TeamMemberRoleORM:
        if not team_member_role.is_persisted():
            return TeamMemberRoleORM(
                role = team_member_role.role,
                team_id = team_member_role.team_id,
                user_id = team_member_role.user.user_id if team_member_role.user and team_member_role.user.is_persisted() else None
            )
        return TeamMemberRoleORM(
            team_member_role_id = team_member_role.team_member_role_id,
            role = team_member_role.role,
            team_id = team_member_role.team_id,
            user_id = team_member_role.user.user_id if team_member_role.user and team_member_role.user.is_persisted() else None
        )
