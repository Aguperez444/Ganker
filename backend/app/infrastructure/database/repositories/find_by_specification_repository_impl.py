from typing import List

from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session, joinedload
from app.application.ports.i_find_by_specifications_service import IFindBySpecificationsRepository
from app.domain.models.team import Team
from app.domain.specifications.base import Specification, AndSpecification
from app.domain.specifications.characters_specification import ByCharactersSpecification
from app.domain.specifications.different_player_id_specification import \
    ByDifferentPlayerIDSpecification
from app.domain.specifications.last_connection_specification import ByLastConnectionSpecification
from app.domain.specifications.name_player_specification import ByNamePlayerSpecification
from app.domain.specifications.ranks_specification import ByRanksSpecification
from app.domain.specifications.roles_specification import ByRolesSpecification
from app.domain.specifications.team.is_active_specification import ByIsActiveSpecification
from app.domain.specifications.team.search_terms_specification import BySearchTermsSpecification
from app.domain.specifications.team.vacant_slots_specification import ByVacantSlotsSpecification
from app.domain.specifications.videogame_specification import ByVideogameSpecification
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
from app.infrastructure.database.models import GameProfileORM, CharacterPriorityORM, RoleProfileORM, UserORM, TeamORM, \
    TeamMemberRoleORM
from app.domain.specifications.regions_specification import ByRegionsSpecification


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
            return query.filter(GameProfileORM.region_id.in_(spec.to_expression()))

        if isinstance(spec, ByCharactersSpecification):
            return query.filter(
                GameProfileORM.character_associations.any(CharacterPriorityORM.character_id.in_(spec.to_expression())))

        if isinstance(spec, ByRolesSpecification):
            return query.filter(GameProfileORM.role_profiles.any(RoleProfileORM.role_id.in_(spec.to_expression())))

        if isinstance(spec, ByRanksSpecification):
            return query.filter(GameProfileORM.role_profiles.any(RoleProfileORM.rank_id.in_(spec.to_expression())))

        # TODO Deberíamos hacer un índice para que esta no destruya el rendimiento recorriendo todos los registros
        if isinstance(spec, ByLastConnectionSpecification):
            return query.join(GameProfileORM.user).filter(UserORM.last_connection >= spec.to_expression())

        if isinstance(spec, ByNamePlayerSpecification):
            name_pattern = f"%{spec.to_expression()}%"
            return query.filter(
                GameProfileORM.user.has(
                    (UserORM.username.ilike(name_pattern)) | (UserORM.name.ilike(name_pattern))
                )
            )

        return query

    def get_videogame_profiles(self, spec: Specification, skip: int, limit: int = 5) -> list['GetGameProfileResponse']:
        # Creamos la query base sobre el modelo de SQLAlchemy
        query = self.session.query(GameProfileORM).options(joinedload(GameProfileORM.user))

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
            ) if game_profile_domain.region else "Sin Especificar"
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
            return query.filter(TeamORM.region_id == spec.to_expression())

        if isinstance(spec, ByRanksSpecification):
            return query.filter(TeamORM.min_rank <= spec.to_expression() & TeamORM.max_rank >= spec.to_expression())

        if isinstance(spec, ByVacantSlotsSpecification):
            # Filtro por equipos con x cantidad de vacantes libres, osea, user_id == None en TeamMemberRoleORM
            target_slots = spec.to_expression()
            subquery = (
                select(TeamMemberRoleORM.team_id)
                .where(TeamMemberRoleORM.user_id.is_(None))
                .group_by(TeamMemberRoleORM.team_id)
                .having(func.count(TeamMemberRoleORM.team_member_role_id) >= target_slots)
                .scalar_subquery()
            )

            return query.filter(TeamORM.team_id.in_(subquery))

        if isinstance(spec, ByRolesSpecification):
            # Filtro equipos que alguna vacante tenga el rol especificado
            return query.filter(TeamORM.members_roles.any(
                TeamMemberRoleORM.game_role_id.in_(spec.to_expression()) & TeamMemberRoleORM.user_id.is_(None)))

        if isinstance(spec, BySearchTermsSpecification):
            return query.filter(or_(TeamORM.name.ilike(spec.to_expression(), escape="\\"),
                                    TeamORM.description.ilike(spec.to_expression(), escape="\\")
                                    )
                                )

        return query

    def get_teams(self, spec: Specification, skip: int, limit: int = 5) -> List[Team]:
        # Creamos la query base sobre el modelo de SQLAlchemy
        query = self.session.query(TeamORM)

        # Le aplicamos los filtros
        if spec:
            query = self._apply_spec_team(query, spec)
        # Paginamos
        db_models = query.order_by(TeamORM.team_id.desc()).offset(skip).limit(limit).all()

        # Pasamos de TeamORM a Team
        return [TeamMapper.orm_to_domain(db_model) for db_model in db_models]

