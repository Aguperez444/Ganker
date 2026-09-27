from app.domain.models.role_profile import RoleProfile
from app.infrastructure.database.mappers.rank_mapper import RankMapper
from app.infrastructure.database.mappers.role_mapper import RoleMapper
from app.infrastructure.database.models.role_profile_orm import RoleProfileORM


class RoleProfileMapper:
    @staticmethod
    def orm_to_domain(role_profile_orm: RoleProfileORM) -> RoleProfile:
        return RoleProfile(
            role_profile_id=role_profile_orm.role_profile_id,
            role=RoleMapper.orm_to_domain(role_profile_orm.role),
            rank=RankMapper.orm_to_domain(role_profile_orm.rank)
        )

    @staticmethod
    def domain_to_orm(role_profile: RoleProfile) -> RoleProfileORM:
        if not role_profile.is_persisted():
            return RoleProfileORM(
                role_id=role_profile.role.role_id,
                rank_id=role_profile.rank.rank_id
            )
        return RoleProfileORM(
            role_profile_id=role_profile.role_profile_id,
            role_id=role_profile.role.role_id,
            rank_id=role_profile.rank.rank_id
        )