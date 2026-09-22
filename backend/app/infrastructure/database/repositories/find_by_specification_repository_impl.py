from typing import cast
from sqlalchemy.orm import Session, joinedload

from app.application.ports.i_find_by_specifications_service import IFindBySpecificationRepository
from app.infrastructure.api.dto.response.base_classes.character_object_response import CharacterObjectResponse
from app.infrastructure.api.dto.response.base_classes.rank_object_response import RankObjectResponse
from app.infrastructure.api.dto.response.base_classes.role_object_response import RoleObjectResponse
from app.infrastructure.api.dto.response.base_classes.role_profile_object_response import RoleProfileObjectResponse
from app.infrastructure.api.dto.response.base_classes.videogame_object_response import VideogameObjectResponse
from app.infrastructure.api.dto.response.get_game_profile_response import GetGameProfileResponse, PlayerObjectResponse
from app.infrastructure.database.mappers.game_profile_mapper import GameProfileMapper
from app.infrastructure.database.models import GameProfileORM, CharacterPriorityORM, RoleProfileORM, UserORM
from app.domain.specifications.base import Specification, AndSpecification
from app.domain.specifications.videogame_profiles.characters_specification import ByCharactersSpecification
from app.domain.specifications.videogame_profiles.last_connection_specification import ByLastConnectionSpecification
from app.domain.specifications.videogame_profiles.ranks_specification import ByRanksSpecification
from app.domain.specifications.videogame_profiles.roles_specification import ByRolesSpecification
from app.domain.specifications.videogame_profiles.videogame_specification import ByVideogameSpecification
from app.domain.specifications.videogame_profiles.different_player_id_specification import ByDifferentPlayerIDSpecification


class FindBySpecificationRepositoryImpl(IFindBySpecificationRepository):
    def __init__(self, session: Session):
        self.session = session

    def _apply_spec(self, query, spec: Specification):
        if not spec:
            return query

        if isinstance(spec, AndSpecification):
            query = self._apply_spec(query, spec.left)
            query = self._apply_spec(query, spec.right)
            return query

        if isinstance(spec, ByDifferentPlayerIDSpecification):
            return query.filter(GameProfileORM.player_id != spec.to_expression())

        if isinstance(spec, ByVideogameSpecification):
            return query.filter(GameProfileORM.videogame_id == spec.to_expression())

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

        return query


    def get_videogame_profiles(self, spec: Specification, skip: int, limit: int) -> list['GetGameProfileResponse']:
        # Creamos la query base sobre el modelo de SQLAlchemy
        query = self.session.query(GameProfileORM).options( joinedload(GameProfileORM.user) )

        # Le aplicamos los filtros
        if spec:
            query = self._apply_spec(query, spec)

        # Paginamos
        db_models = query.offset(skip).limit(limit).all()

        # Lo pasamos de GameProfileORM a GameProfile
        return [self.map_orm_to_search_response(db_model) for db_model in db_models]

    @staticmethod
    def map_orm_to_search_response(orm_model: GameProfileORM) -> GetGameProfileResponse:


        player = PlayerObjectResponse(
            player_id= orm_model.user.user_id,
            player_name= orm_model.user.username,
            icon_url= orm_model.user.icon_url,
            last_connection= orm_model.user.last_connection
        )
        game_profile_domain = GameProfileMapper.orm_to_domain(orm_model)

        ordered_characters = [char_priority.character for char_priority in
                              sorted(game_profile_domain.characters_priority, key=lambda cp: cp.priority)]
        
        return GetGameProfileResponse(
            
            game_profile_id= cast(int, game_profile_domain.game_profile_id),
            player= player,
            videogame=VideogameObjectResponse(
                id=cast(int, game_profile_domain.videogame.videogame_id),
                name=game_profile_domain.videogame.name,
                icon_url=game_profile_domain.videogame.icon_url,
                rank_per_role=game_profile_domain.videogame.rank_per_role,
            ),
            characters=[CharacterObjectResponse(character_id=cast(int, character.character_id), name=character.name,
                                                icon_url=character.icon_url) for character in ordered_characters],
            role_profiles=[RoleProfileObjectResponse(
                role_profile_id=cast(int, role_profile.role_profile_id),
                role=RoleObjectResponse(role_id=cast(int, role_profile.role.role_id), name=role_profile.role.name,
                                        icon_url=role_profile.role.icon_url),
                rank=RankObjectResponse(
                    rank_id=cast(int, role_profile.rank.rank_id), name=role_profile.rank.name,
                    icon_url=role_profile.rank.icon_url, value=role_profile.rank.value)
            ) for role_profile in game_profile_domain.role_profiles]
        )