import pytest
from app.domain.models.game_profile import GameProfile
from app.domain.models.role_profile import RoleProfile
from app.infrastructure.database.mappers.videogame_mapper import VideogameMapper
from app.infrastructure.database.mappers.character_mapper import CharacterMapper
from app.infrastructure.database.mappers.role_mapper import RoleMapper
from app.infrastructure.database.mappers.rank_mapper import RankMapper
from app.infrastructure.database.repositories.game_profile_repository_impl import GameProfileRepositoryImpl


class TestGameProfileRepositoryIntegration:

    def test_create_and_get_game_profile(self, test_db_session, seed_catalog_data, seed_player):
        repo = GameProfileRepositoryImpl(test_db_session)

        vg_domain = VideogameMapper.orm_to_domain(seed_catalog_data["videogame"])
        char1 = CharacterMapper.orm_to_domain(seed_catalog_data["characters"][0])
        char2 = CharacterMapper.orm_to_domain(seed_catalog_data["characters"][1])
        role1 = RoleMapper.orm_to_domain(seed_catalog_data["roles"][0])
        rank1 = RankMapper.orm_to_domain(seed_catalog_data["ranks"][0])

        role_profile = RoleProfile(role_profile_id=None, role=role1, rank=rank1)

        game_profile = GameProfile(
            game_profile_id=None,
            player_id=seed_player.player_id,
            videogame=vg_domain,
            characters=[char1, char2],
            role_profiles=[role_profile]
        )

        created = repo.create_game_profile(game_profile)
        test_db_session.commit()

        assert created.game_profile_id is not None
        assert created.player_id == seed_player.player_id
        assert len(created.characters) == 2
        assert len(created.role_profiles) == 1

        # Retrieve by ID
        found = repo.get_game_profile_by_id(created.game_profile_id)
        assert found is not None
        assert found.game_profile_id == created.game_profile_id
        assert found.videogame.name == "League of Legends"
        assert len(found.characters) == 2
        assert len(found.role_profiles) == 1

        # Retrieve by Player and Videogame
        found_by_pv = repo.get_game_profile_by_player_and_videogame(
            player_id=seed_player.player_id,
            videogame_id=vg_domain.videogame_id
        )
        assert found_by_pv is not None
        assert found_by_pv.game_profile_id == created.game_profile_id

    def test_get_game_profile_not_found(self, test_db_session):
        repo = GameProfileRepositoryImpl(test_db_session)
        assert repo.get_game_profile_by_id(999) is None
        assert repo.get_game_profile_by_player_and_videogame(999, 999) is None
