from typing import TYPE_CHECKING, Optional

from sqlalchemy.orm import Session

from app.application.ports.i_team_repository import ITeamRepository
from app.domain.exceptions.team.team_not_found_exception import TeamNotFoundException
from app.infrastructure.database.mappers.team_mapper import TeamMapper
from app.infrastructure.database.models.team_orm import TeamORM

if TYPE_CHECKING:
    from app.domain.models.team import Team


class TeamRepositoryImpl(ITeamRepository):
    def __init__(self, session: Session):
        self.session = session

    def get_by_id_for_update(self, team_id: int) -> Optional['Team']:
        team_orm = (
            self.session.query(TeamORM)
            .filter(TeamORM.team_id == team_id)
            .with_for_update()
            .first()
        )
        return TeamMapper.orm_to_domain(team_orm) if team_orm else None

    def update_team_members(self, target_team: 'Team') -> 'Team':
        team_orm = (
            self.session.query(TeamORM)
            .filter(TeamORM.team_id == target_team.team_id)
            .first()
        )
        if team_orm is None:
            raise TeamNotFoundException(target_team.team_id)

        member_users_by_id = {
            member.team_member_role_id: (
                member.user.user_id if member.user is not None else None
            )
            for member in target_team.members
        }
        for member_orm in team_orm.members_roles:
            if member_orm.team_member_role_id in member_users_by_id:
                member_orm.user_id = member_users_by_id[member_orm.team_member_role_id]

        self.session.flush()
        self.session.expire(team_orm, ["members_roles"])
        return TeamMapper.orm_to_domain(team_orm)
