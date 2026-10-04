from typing import TYPE_CHECKING, Optional

from sqlalchemy.orm import Session

from app.application.ports.i_team_repository import ITeamRepository
from app.domain.exceptions.team.team_not_found_exception import TeamNotFoundException
from app.infrastructure.database.mappers.team_mapper import TeamMapper
from app.infrastructure.database.models.team_orm import TeamORM
from app.infrastructure.database.models.conversation_member_orm import ConversationMemberORM
from app.infrastructure.database.models.team_member_role_orm import TeamMemberRoleORM
from app.infrastructure.database.mappers.conversation_mapper import ConversationMapper

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

        # Actualizar miembros de la conversación
        existing_conv_member_user_ids = {m.user_id for m in team_orm.conversation.members}
        for conv_member in target_team.conversation.members:
            if conv_member.user.user_id not in existing_conv_member_user_ids:
                new_member_orm = ConversationMemberORM(
                    conversation_id=team_orm.conversation_id,
                    user_id=conv_member.user.user_id,
                    role=conv_member.role.value if conv_member.role else None
                )
                team_orm.conversation.members.append(new_member_orm)
                existing_conv_member_user_ids.add(conv_member.user.user_id)

        self.session.flush()
        self.session.expire(team_orm, ["members_roles"])
        return TeamMapper.orm_to_domain(team_orm)

    def is_user_in_any_active_team(self, user_id: int) -> bool:

        return self.session.query(TeamMemberRoleORM).filter(
            TeamMemberRoleORM.user_id == user_id
        ).count() > 0

    def create_team(self, team: 'Team') -> 'Team':
        team_orm = TeamMapper.domain_to_orm(team)

        if team.conversation and not team.conversation.is_persisted():
            team_orm.conversation = ConversationMapper.domain_to_orm(team.conversation)
            
        self.session.add(team_orm)
        self.session.flush()
        return TeamMapper.orm_to_domain(team_orm)
