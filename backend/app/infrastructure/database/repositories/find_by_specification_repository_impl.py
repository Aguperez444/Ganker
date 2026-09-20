from sqlalchemy.orm import Session

from app.application.ports.i_find_by_specifications_service import IFindBySpecificationRepository
from app.infrastructure.database.mappers.game_profile_mapper import GameProfileMapper
from app.infrastructure.database.models import GameProfileORM, CharacterPriorityORM, RoleProfileORM, UserORM
from app.domain.models.game_profile import GameProfile
from app.domain.specifications.base import Specification, AndSpecification
from app.domain.specifications.videogame_profiles.characters_specification import ByCharactersSpecification
from app.domain.specifications.videogame_profiles.last_connection_specification import ByLastConnectionSpecification
from app.domain.specifications.videogame_profiles.ranks_specification import ByRanksSpecification
from app.domain.specifications.videogame_profiles.regular_routine_specification import ByRegularRoutineSpecification
from app.domain.specifications.videogame_profiles.roles_specification import ByRolesSpecification
from app.domain.specifications.videogame_profiles.videogame_specification import ByVideogameSpecification


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

        if isinstance(spec, ByVideogameSpecification):
            return query.filter(GameProfileORM.videogame_id == spec.to_expression())

        if isinstance(spec, ByCharactersSpecification):
            return query.filter(
                GameProfileORM.character_associations.any(CharacterPriorityORM.character_id.in_(spec.to_expression())))

        if isinstance(spec, ByRolesSpecification):
            return query.filter(GameProfileORM.role_profiles.any(RoleProfileORM.role_id.in_(spec.to_expression())))

        if isinstance(spec, ByRanksSpecification):
            return query.filter(GameProfileORM.role_profiles.any(RoleProfileORM.rank_id.in_(spec.to_expression())))

        # Deberíamos hacer un índice para que esta no destruya el rendimiento recorriendo todos los registros
        if isinstance(spec, ByLastConnectionSpecification):
            return query.join(GameProfileORM.user).filter(UserORM.last_connection >= spec.to_expression())
        # TODO FALTA HORARIO HABITUAL
        #if isinstance(spec, ByRegularRoutineSpecification):

        return query


    def get_videogame_profiles(self, spec: Specification, skip: int, limit: int) -> list['GameProfile']:
        # Creamos la query base sobre el modelo de SQLAlchemy
        query = self.session.query(GameProfileORM)

        # Le aplicamos los filtros
        if spec:
            query = self._apply_spec(query, spec)

        # Paginamos
        db_models = query.offset(skip).limit(limit).all()

        # Lo pasamos de GameProfileORM a GameProfile
        return [GameProfileMapper.orm_to_domain(model) for model in db_models]