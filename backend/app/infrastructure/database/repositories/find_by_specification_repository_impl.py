from typing import List

from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session, joinedload, aliased
from app.application.ports.i_find_by_specifications_service import IFindBySpecificationsRepository
from app.domain.models.team import Team
from app.domain.specifications.banned_players.banned_by_specification import ByBannedBySpecification
from app.domain.specifications.banned_players.banned_user_specfication import ByBannedUsersSpecification
from app.domain.specifications.banned_players.create_at_specification import (
    ByCreateAtSpecification as ByBannedCreateAtSpecification,
)
from app.domain.specifications.banned_players.expires_at_specification import ByExpiresAtSpecification
from app.domain.specifications.banned_players.reason_specification import ByReasonSpecification
from app.domain.specifications.base import Specification, AndSpecification
from app.domain.specifications.characters_specification import ByCharactersSpecification
from app.domain.specifications.different_player_id_specification import \
    ByDifferentPlayerIDSpecification
from app.domain.specifications.last_connection_specification import ByLastConnectionSpecification
from app.domain.specifications.name_player_specification import ByNamePlayerSpecification
from app.domain.specifications.ranks_specification import ByRanksSpecification
from app.domain.specifications.reports_players.reason_specification import ByReasonsSpecification
from app.domain.specifications.reports_players.reported_by_specification import ByReportedBySpecification
from app.domain.specifications.reports_players.reported_user_specification import ByReportedUserSpecification
from app.domain.specifications.reports_players.resolved_at_specification import ByResolvedAtSpecification
from app.domain.specifications.reports_players.resolved_by_specification import ByResolvedBySpecification
from app.domain.specifications.reports_players.status_specification import ByStatusSpecification
from app.domain.specifications.reports_players.create_at_specification import (
    ByCreateAtSpecification as ByReportCreateAtSpecification,
)
from app.domain.specifications.roles_specification import ByRolesSpecification
from app.domain.specifications.team.is_active_specification import ByIsActiveSpecification
from app.domain.specifications.team.search_terms_specification import BySearchTermsSpecification
from app.domain.specifications.team.vacant_slots_specification import ByVacantSlotsSpecification
from app.domain.specifications.videogame_specification import ByVideogameSpecification
from app.domain.specifications.regions_specification import ByRegionsSpecification
from app.infrastructure.api.dto.response.base_classes.character_object_response import CharacterObjectResponse
from app.infrastructure.api.dto.response.base_classes.rank_object_response import RankObjectResponse
from app.infrastructure.api.dto.response.base_classes.region_object_response import RegionObjectResponse
from app.infrastructure.api.dto.response.base_classes.role_object_response import RoleObjectResponse
from app.infrastructure.api.dto.response.base_classes.role_profile_object_response import RoleProfileObjectResponse
from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse
from app.infrastructure.api.dto.response.get.get_game_profile_response import GetGameProfileResponse, \
    PlayerObjectResponse
from app.infrastructure.database.mappers.game_profile_mapper import GameProfileMapper
from app.infrastructure.database.mappers.team_mapper import TeamMapper
from app.infrastructure.database.models import (
    GameProfileORM,
    CharacterPriorityORM,
    RoleProfileORM,
    UserORM,
    TeamORM,
    TeamMemberRoleORM,
    RankORM,
    VideogameORM,
    RoleORM,
    CharacterORM,
    RegionORM,
)
from app.infrastructure.database.models.player_report_orm import PlayerReportORM
from app.infrastructure.database.models.users_banned import UsersBanned


class FindBySpecificationsRepositoryImpl(IFindBySpecificationsRepository):
    def __init__(self, session: Session):
        self.session = session

    def _apply_spec_game_profile(self, query, spec: Specification):
        if not spec:
            return query

        if isinstance(spec, AndSpecification):
            query = self._apply_spec_game_profile(query, spec.left)
            query = self._apply_spec_game_profile(query, spec.right)
            return query

        if isinstance(spec, ByDifferentPlayerIDSpecification):
            return query.filter(GameProfileORM.player_id != spec.to_expression())

        if isinstance(spec, ByVideogameSpecification):
            return query.filter(GameProfileORM.videogame_id == spec.to_expression())

        if isinstance(spec, ByRegionsSpecification):
            val = spec.to_expression()
            if isinstance(val, (list, tuple, set)):
                return query.filter(
                    GameProfileORM.region_id.in_(val),
                    GameProfileORM.region.has(RegionORM.deleted == False),
                )
            return query.filter(
                GameProfileORM.region_id == val,
                GameProfileORM.region.has(RegionORM.deleted == False),
            )

        if isinstance(spec, ByCharactersSpecification):
            return query.filter(
                GameProfileORM.character_associations.any(
                    CharacterPriorityORM.character_id.in_(spec.to_expression())
                    & (CharacterPriorityORM.deleted == False)
                    & CharacterPriorityORM.character.has(CharacterORM.deleted == False)
                )
            )

        if isinstance(spec, ByRolesSpecification):
            val = spec.to_expression()
            role_cond = (
                RoleProfileORM.role_id.in_(val)
                if isinstance(val, (list, tuple, set))
                else (RoleProfileORM.role_id == val)
            )
            return query.filter(
                GameProfileORM.role_profiles.any(
                    role_cond
                    & (RoleProfileORM.deleted == False)
                    & RoleProfileORM.role.has(RoleORM.deleted == False)
                    & RoleProfileORM.rank.has(RankORM.deleted == False)
                )
            )

        if isinstance(spec, ByRanksSpecification):
            val = spec.to_expression()
            rank_cond = (
                RoleProfileORM.rank_id.in_(val)
                if isinstance(val, (list, tuple, set))
                else (RoleProfileORM.rank_id == val)
            )
            return query.filter(
                GameProfileORM.role_profiles.any(
                    rank_cond
                    & (RoleProfileORM.deleted == False)
                    & RoleProfileORM.role.has(RoleORM.deleted == False)
                    & RoleProfileORM.rank.has(RankORM.deleted == False)
                )
            )

        # TODO Deberíamos hacer un índice para que esta no destruya el rendimiento recorriendo todos los registros
        if isinstance(spec, ByLastConnectionSpecification):
            return query.join(GameProfileORM.user).filter(
                UserORM.last_connection >= spec.to_expression(),
                UserORM.deleted == False, UserORM.banned == False
            )

        if isinstance(spec, ByNamePlayerSpecification):
            name_pattern = f"%{spec.to_expression()}%"
            return query.filter(
                GameProfileORM.user.has(
                    ((UserORM.username.ilike(name_pattern)) | (UserORM.name.ilike(name_pattern)))
                    & (UserORM.deleted == False)
                    & (UserORM.banned == False)
                )
            )

        return query

    def get_videogame_profiles(self, spec: Specification, skip: int, limit: int = 5) -> list['GetGameProfileResponse']:
        # Creamos la query base sobre el modelo de SQLAlchemy excluyendo entidades borradas lógicamente
        query = (
            self.session.query(GameProfileORM)
            .options(joinedload(GameProfileORM.user))
            .filter(
                GameProfileORM.deleted == False,
                GameProfileORM.user.has(UserORM.deleted == False),
                GameProfileORM.user.has(UserORM.banned == False),
                GameProfileORM.videogame.has(VideogameORM.deleted == False),
            )
        )

        # Le aplicamos los filtros
        if spec:
            query = self._apply_spec_game_profile(query, spec)

        # Paginamos
        db_models = query.offset(skip).limit(limit).all()

        # Lo pasamos de GameProfileORM a GameProfile
        return [self.map_orm_gameprofile_to_search_gameprofile_response(db_model) for db_model in db_models]

    @staticmethod
    def map_orm_gameprofile_to_search_gameprofile_response(orm_model: GameProfileORM) -> GetGameProfileResponse:

        player = PlayerObjectResponse(
            player_id=orm_model.user.user_id,
            player_name=orm_model.user.username,
            icon_url=orm_model.user.icon_url,
            last_connection=orm_model.user.last_connection
        )
        game_profile_domain = GameProfileMapper.orm_to_domain(orm_model)

        ordered_characters = [char_priority.character for char_priority in
                              sorted(game_profile_domain.characters_priority, key=lambda cp: cp.priority)]

        return GetGameProfileResponse(

            game_profile_id=game_profile_domain.game_profile_id,
            player=player,
            videogame=VideogameObjectResponse(
                id=game_profile_domain.videogame.videogame_id,
                name=game_profile_domain.videogame.name,
                icon_url=game_profile_domain.videogame.icon_url,
                rank_per_role=game_profile_domain.videogame.rank_per_role,
                has_characters=game_profile_domain.videogame.has_characters,
            ),
            characters=[CharacterObjectResponse(character_id=character.character_id, name=character.name,
                                                icon_url=character.icon_url) for character in ordered_characters],
            role_profiles=[RoleProfileObjectResponse(
                role_profile_id=role_profile.role_profile_id,
                role=RoleObjectResponse(role_id=role_profile.role.role_id, name=role_profile.role.name,
                                        icon_url=role_profile.role.icon_url),
                rank=RankObjectResponse(
                    rank_id=role_profile.rank.rank_id, name=role_profile.rank.name,
                    icon_url=role_profile.rank.icon_url, value=role_profile.rank.value)
            ) for role_profile in game_profile_domain.role_profiles],
            region=RegionObjectResponse(
                region_id=game_profile_domain.region.region_id,
                name=game_profile_domain.region.name
            ) if game_profile_domain.region else "Sin Especificar",
            in_game_name=game_profile_domain.in_game_name
        )

    def _apply_spec_team(self, query, spec: Specification):
        if not spec:
            return query

        if isinstance(spec, AndSpecification):
            query = self._apply_spec_team(query, spec.left)
            query = self._apply_spec_team(query, spec.right)
            return query

        # Filtrar por activo, videojuego, region, rango, vacantes libres, rol y términos de búsqueda

        if isinstance(spec, ByIsActiveSpecification):
            return query.filter(TeamORM.is_active == spec.to_expression())

        if isinstance(spec, ByVideogameSpecification):
            return query.filter(TeamORM.videogame_id == spec.to_expression())

        if isinstance(spec, ByRegionsSpecification):
            val = spec.to_expression()
            if isinstance(val, (list, tuple, set)):
                return query.filter(TeamORM.region_id.in_(val))
            return query.filter(TeamORM.region_id == val)

        if isinstance(spec, ByRanksSpecification):
            min_rank_alias = aliased(RankORM)
            max_rank_alias = aliased(RankORM)
            return (query
                    .join(min_rank_alias, TeamORM.min_rank)
                    .join(max_rank_alias, TeamORM.max_rank)
                    .filter(min_rank_alias.value <= spec.to_expression())
                    .filter(max_rank_alias.value >= spec.to_expression()))

        if isinstance(spec, ByVacantSlotsSpecification):
            # Filtro por equipos con x cantidad de vacantes libres, osea, user_id == None en TeamMemberRoleORM
            target_slots = spec.to_expression()
            subquery = (
                select(TeamMemberRoleORM.team_id)
                .where(
                    TeamMemberRoleORM.user_id.is_(None)
                    | TeamMemberRoleORM.user.has((UserORM.deleted == True) | (UserORM.banned == True))
                )
                .group_by(TeamMemberRoleORM.team_id)
                .having(func.count(TeamMemberRoleORM.team_member_role_id) >= target_slots)
                .scalar_subquery()
            )

            return query.filter(TeamORM.team_id.in_(subquery))

        if isinstance(spec, ByRolesSpecification):
            # Filtro equipos que alguna vacante tenga el rol especificado
            val = spec.to_expression()
            role_filter = TeamMemberRoleORM.game_role_id.in_(val) if isinstance(val, (list, tuple, set)) else (TeamMemberRoleORM.game_role_id == val)
            return query.filter(TeamORM.members_roles.any(
                role_filter & (
                    TeamMemberRoleORM.user_id.is_(None)
                    | TeamMemberRoleORM.user.has((UserORM.deleted == True) | (UserORM.banned == True))
                )
            ))

        if isinstance(spec, BySearchTermsSpecification):
            return query.filter(or_(TeamORM.name.ilike(spec.to_expression(), escape="\\"),
                                    TeamORM.description.ilike(spec.to_expression(), escape="\\")
                                    )
                                )

        return query

    def get_teams(self, spec: Specification, skip: int, limit: int = 5) -> List[Team]:
        # Creamos la query base sobre el modelo de SQLAlchemy excluyendo equipos cuyo líder esté baneado o eliminado
        query = self.session.query(TeamORM).filter(
            TeamORM.videogame.has(VideogameORM.deleted == False),
            ~TeamORM.members_roles.any(
                (TeamMemberRoleORM.team_role_id == 1)
                & TeamMemberRoleORM.user.has((UserORM.deleted == True) | (UserORM.banned == True))
            ),
        )

        # Le aplicamos los filtros
        if spec:
            query = self._apply_spec_team(query, spec)
        # Paginamos
        db_models = query.order_by(TeamORM.team_id.desc()).offset(skip).limit(limit).all()

        # Pasamos de TeamORM a Team
        return [TeamMapper.orm_to_domain(db_model) for db_model in db_models]

    def _apply_spec_banned_players(self, query, spec: Specification):
        if not spec:
            return query

        if isinstance(spec, AndSpecification):
            query = self._apply_spec_banned_players(query, spec.left)
            query = self._apply_spec_banned_players(query, spec.right)
            return query


        if isinstance(spec, ByBannedBySpecification):
            admin_alias = aliased(UserORM)

            return (query.join(admin_alias, admin_alias.user_id == UsersBanned.banned_by)
                    .filter(admin_alias.username.ilike(f"%{spec.to_expression()}%"), admin_alias.deleted == False))

        if isinstance(spec, ByBannedUsersSpecification):
            player_alias = aliased(UserORM)
            return (query.join(player_alias, player_alias.user_id == UsersBanned.banned_user)
                    .filter(player_alias.username.ilike(f"%{spec.to_expression()}%"), player_alias.deleted == False))

        if isinstance(spec, ByBannedCreateAtSpecification):
            min_date, max_date = spec.to_expression()
            if min_date is not None:
                query = query.filter(UsersBanned.create_at >= min_date)
            if max_date is not None:
                query = query.filter(UsersBanned.create_at <= max_date)
            return query

        if isinstance(spec, ByExpiresAtSpecification):
            min_date, max_date = spec.to_expression()
            if min_date is not None:
                query = query.filter(UsersBanned.expires_at >= min_date)
            if max_date is not None:
                query = query.filter(UsersBanned.expires_at <= max_date)
            return query

        if isinstance(spec, ByReasonSpecification):
            return query.filter(UsersBanned.reason == spec.to_expression())

        return query

    def get_banned_players(self, spec: Specification | None, skip: int, limit: int = 5) -> List[UsersBanned]:
        query = (self.session.query(UsersBanned)
        .options(
            joinedload(UsersBanned.banned_player),
            joinedload(UsersBanned.moderator_banned_player)
        )
        .filter(
            UsersBanned.banned_player.has(UserORM.deleted == False)
        ))

        # Le aplicamos los filtros
        if spec and spec is not None:
            query = self._apply_spec_banned_players(query, spec)

        # Paginamos
        db_models = query.order_by(UsersBanned.create_at.desc()).offset(skip).limit(limit).all()

        return db_models

    def _apply_spec_reports_players(self, query, spec: Specification):
        if not spec:
            return query

        if isinstance(spec, AndSpecification):
            query = self._apply_spec_reports_players(query, spec.left)
            query = self._apply_spec_reports_players(query, spec.right)
            return query

        if isinstance(spec, ByReportedUserSpecification):
            reported_user_alias = aliased(UserORM)
            return (query.join(reported_user_alias, reported_user_alias.user_id == PlayerReportORM.reported_id)
                    .filter(reported_user_alias.username.ilike(f"%{spec.to_expression()}%"), reported_user_alias.deleted == False)
                    )
        if isinstance(spec, ByReportedBySpecification):
            reporter_alias = aliased(UserORM)
            return (query.join(reporter_alias, reporter_alias.user_id == PlayerReportORM.reporter_id)
                    .filter(reporter_alias.username.ilike(f"%{spec.to_expression()}%"), reporter_alias.deleted == False)
                    )

        if isinstance(spec, ByResolvedBySpecification):
            resolver_alias = aliased(UserORM)
            return (query.join(resolver_alias, resolver_alias.user_id == PlayerReportORM.resolver_id)
                    .filter(resolver_alias.username.ilike(f"%{spec.to_expression()}%"), resolver_alias.deleted == False)
                    )

        if isinstance(spec, (ByReasonsSpecification, ByReasonSpecification)):
            return query.filter(PlayerReportORM.reason == spec.to_expression())

        if isinstance(spec, ByResolvedAtSpecification):
            min_date, max_date = spec.to_expression()
            if min_date is not None:
                query = query.filter(PlayerReportORM.resolved_at >= min_date)
            if max_date is not None:
                query = query.filter(PlayerReportORM.resolved_at <= max_date)
            return query

        if isinstance(spec, ByStatusSpecification):
            return query.filter(PlayerReportORM.status == spec.to_expression())

        if isinstance(spec, ByReportCreateAtSpecification):
            min_date, max_date = spec.to_expression()
            if min_date is not None:
                query = query.filter(PlayerReportORM.created_at >= min_date)
            if max_date is not None:
                query = query.filter(PlayerReportORM.created_at <= max_date)
            return query

        return query

    def get_reports_players(self, spec: Specification | None, skip: int, limit: int) -> list['PlayerReportORM']:
        query = self.session.query(PlayerReportORM).options(
            joinedload(PlayerReportORM.reporter),
            joinedload(PlayerReportORM.reported),
            joinedload(PlayerReportORM.resolver_user)
        ).filter(PlayerReportORM.reported.has(UserORM.deleted == False))

        if spec and spec is not None:
            query = self._apply_spec_reports_players(query, spec)

        db_models = query.order_by(PlayerReportORM.created_at.desc()).offset(skip).limit(limit).all()


        return db_models