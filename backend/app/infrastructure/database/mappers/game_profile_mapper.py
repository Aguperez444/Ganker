from app.domain.models.game_profile import GameProfile
from app.infrastructure.database.mappers.character_priority_mapper import CharacterPriorityMapper
from app.infrastructure.database.mappers.region_mapper import RegionMapper
from app.infrastructure.database.mappers.role_profile_mapper import RoleProfileMapper
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.models.game_profile_orm import GameProfileORM


class GameProfileMapper:
    @staticmethod
    def orm_to_domain(game_profile_orm: GameProfileORM) -> GameProfile:
        return GameProfile(
            game_profile_id=game_profile_orm.game_profile_id,
            player_id=game_profile_orm.player_id,
            videogame=VideogameMapper.orm_to_domain(game_profile_orm.videogame),
            characters_priority=[CharacterPriorityMapper.orm_to_domain(char) for char in game_profile_orm.character_associations],
            role_profiles=[RoleProfileMapper.orm_to_domain(role_profile) for role_profile in game_profile_orm.role_profiles],
            region=RegionMapper.orm_to_domain(game_profile_orm.region) if game_profile_orm.region else None
        )

    @staticmethod
    def domain_to_orm(game_profile_domain: GameProfile) -> GameProfileORM:
        if not game_profile_domain.is_persisted():
            return GameProfileORM(
                player_id=game_profile_domain.player_id,
                videogame_id=game_profile_domain.videogame.videogame_id,
                role_profiles=[RoleProfileMapper.domain_to_orm(role_profile) for role_profile in game_profile_domain.role_profiles],
                character_associations=[CharacterPriorityMapper.domain_to_orm(char_priority) for char_priority in game_profile_domain.characters_priority],
                region_id=game_profile_domain.region.region_id if game_profile_domain.region else None
            )
        return GameProfileORM(
            game_profile_id=game_profile_domain.game_profile_id,
            player_id=game_profile_domain.player_id,
            videogame_id=game_profile_domain.videogame.videogame_id,
            role_profiles=[RoleProfileMapper.domain_to_orm(role_profile) for role_profile in game_profile_domain.role_profiles],
            character_associations=[CharacterPriorityMapper.domain_to_orm(char_priority) for char_priority in game_profile_domain.characters_priority],
            region_id=game_profile_domain.region.region_id if game_profile_domain.region else None
        )