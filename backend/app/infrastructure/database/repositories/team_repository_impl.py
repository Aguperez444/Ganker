from typing import TYPE_CHECKING, Optional

from sqlalchemy.orm import Session, aliased
from sqlalchemy import or_, and_, func, select

from app.application.ports.i_team_repository import ITeamRepository
from app.domain.exceptions.team.team_not_found_exception import TeamNotFoundException
from app.infrastructure.database.mappers.team_mapper import TeamMapper
from app.infrastructure.database.models.team_orm import TeamORM
from app.infrastructure.database.models.rank_orm import RankORM
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

        # Obtener los IDs de usuario de los miembros de la conversación del equipo actualizado
        target_conv_member_user_ids = {
            m.user.user_id for m in target_team.conversation.members if m.user is not None
        }
        # Eliminar miembros que ya no estén en la conversación
        team_orm.conversation.members = [
            member for member in team_orm.conversation.members
            if member.user_id in target_conv_member_user_ids
        ]
        # Agregar miembros nuevos
        existing_conv_member_user_ids = {member.user_id for member in team_orm.conversation.members}
        for conv_member in target_team.conversation.members:
            if conv_member.user and conv_member.user.user_id not in existing_conv_member_user_ids:
                new_member_orm = ConversationMemberORM(
                    conversation_id=team_orm.conversation_id,
                    user_id=conv_member.user.user_id,
                    role=conv_member.role.value if conv_member.role else None
                )
                team_orm.conversation.members.append(new_member_orm)
                existing_conv_member_user_ids.add(conv_member.user.user_id)

        self.session.flush()
        self.session.expire(team_orm, ["members_roles"])
        if team_orm.conversation:
            self.session.expire(team_orm.conversation, ["members"])
        return TeamMapper.orm_to_domain(team_orm)

    def update_team(self, team: 'Team') -> 'Team':
        team_orm = self.session.query(TeamORM).filter(TeamORM.team_id == team.team_id).first()
        if team_orm is None:
            raise TeamNotFoundException(team.team_id)

        team_orm.name = team.name
        team_orm.description = team.description
        team_orm.allow_other_regions = team.allow_other_regions
        team_orm.region_id = team.region.region_id if team.region else None
        team_orm.min_rank_id = team.min_rank.rank_id
        team_orm.max_rank_id = team.max_rank.rank_id

        if team_orm.conversation:
            team_orm.conversation.name = f"Chat del equipo {team.name}"

        self.session.flush()
        self.session.expire(team_orm)
        return TeamMapper.orm_to_domain(team_orm)


    def get_by_id(self, team_id: int) -> Optional['Team']:
        team_orm = self.session.query(TeamORM).filter(TeamORM.team_id == team_id).first()
        return TeamMapper.orm_to_domain(team_orm) if team_orm else None

    def get_active_team_by_user_id(self, user_id: int) -> Optional['Team']:
        team_orm = (
            self.session.query(TeamORM)
            .join(TeamMemberRoleORM, TeamMemberRoleORM.team_id == TeamORM.team_id)
            .filter(TeamMemberRoleORM.user_id == user_id, TeamORM.is_active.is_(True))
            .first()
        )
        return TeamMapper.orm_to_domain(team_orm) if team_orm else None

    def is_user_in_any_active_team(self, user_id: int) -> bool:
        return self.session.query(TeamMemberRoleORM).join(
            TeamORM, TeamORM.team_id == TeamMemberRoleORM.team_id
        ).filter(
            TeamMemberRoleORM.user_id == user_id,
            TeamORM.is_active.is_(True)
        ).count() > 0

    def create_team(self, team: 'Team') -> 'Team':
        team_orm = TeamMapper.domain_to_orm(team)

        if team.conversation and not team.conversation.is_persisted():
            team_orm.conversation = ConversationMapper.domain_to_orm(team.conversation)
            
        self.session.add(team_orm)
        self.session.flush()
        return TeamMapper.orm_to_domain(team_orm)

    def search_teams(self, videogame_id: Optional[int] = None, region_id: Optional[int] = None,
                     rank_id: Optional[int] = None, vacant_slots: Optional[int] = None,
                     role_id: Optional[int] = None, search_term: Optional[str] = None,
                     limit: Optional[int] = None, offset: int = 0) -> list['Team']:
        query = self.session.query(TeamORM).filter(TeamORM.is_active.is_(True))

        # Cantidad de vacantes de cada equipo (subconsulta correlacionada)
        vacant_count = (
            select(func.count(TeamMemberRoleORM.team_member_role_id))
            .where(TeamMemberRoleORM.team_id == TeamORM.team_id, TeamMemberRoleORM.user_id.is_(None))
            .correlate(TeamORM)
            .scalar_subquery()
        )
        # Solo equipos con cupos vacantes (y, si se pide, con al menos esa cantidad)
        query = query.filter(vacant_count >= max(vacant_slots or 1, 1))

        if videogame_id:
            query = query.filter(TeamORM.videogame_id == videogame_id)

        if region_id:
            query = query.filter(TeamORM.region_id == region_id)

        if rank_id is not None:
            rank_value = select(RankORM.value).where(RankORM.rank_id == rank_id).scalar_subquery()
            MinRank, MaxRank = aliased(RankORM), aliased(RankORM)
            query = (
                 query.join(MinRank, TeamORM.min_rank_id == MinRank.rank_id)
                .join(MaxRank, TeamORM.max_rank_id == MaxRank.rank_id)
                .where(MinRank.value <= rank_value, MaxRank.value >= rank_value)
            )

        if role_id:
            query = query.filter(TeamORM.members_roles.any(and_(
                TeamMemberRoleORM.game_role_id == role_id,
                TeamMemberRoleORM.user_id.is_(None)
            )))

        if search_term:
            escaped = search_term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            pattern = f"%{escaped}%"
            query = query.filter(or_(
                TeamORM.name.ilike(pattern, escape="\\"),
                TeamORM.description.ilike(pattern, escape="\\")
            ))

        # Los equipos más recientes primero
        query = query.order_by(TeamORM.team_id.desc()).offset(offset)
        if limit is not None:
            query = query.limit(limit)
        else:
            query = query.limit(20)  # Valor predeterminado si no se proporciona un límite

        return [TeamMapper.orm_to_domain(team) for team in query.all()]

    def get_team_info_by_conversation_ids(self, conversation_ids: list[int]) -> dict[int, tuple[int, Optional[str]]]:
        if not conversation_ids:
            return {}
        rows = self.session.query(TeamORM.conversation_id, TeamORM.team_id, TeamORM.icon_url).filter(
            TeamORM.conversation_id.in_(conversation_ids)
        ).all()
        return {conversation_id: (team_id, icon_url) for conversation_id, team_id, icon_url in rows}
