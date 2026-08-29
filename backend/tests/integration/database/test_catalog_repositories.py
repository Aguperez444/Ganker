import pytest
from app.infrastructure.database.repositories.videogame_repository_impl import VideogameRepositoryImpl
from app.infrastructure.database.repositories.character_repository_impl import CharacterRepositoryImpl
from app.infrastructure.database.repositories.role_repository_impl import RoleRepositoryImpl
from app.infrastructure.database.repositories.rank_repository_impl import RankRepositoryImpl


class TestCatalogRepositoriesIntegration:

    def test_videogame_repository(self, test_db_session, seed_catalog_data):
        repo = VideogameRepositoryImpl(test_db_session)
        vg_orm = seed_catalog_data["videogame"]

        found = repo.get_videogame_by_id(vg_orm.videogame_id)
        assert found is not None
        assert found.videogame_id == vg_orm.videogame_id
        assert found.name == "League of Legends"

        not_found = repo.get_videogame_by_id(99999)
        assert not_found is None

    def test_character_repository(self, test_db_session, seed_catalog_data):
        repo = CharacterRepositoryImpl(test_db_session)
        char_orm = seed_catalog_data["characters"][0]

        found = repo.get_character_by_id(char_orm.character_id)
        assert found is not None
        assert found.character_id == char_orm.character_id
        assert found.name == "Ahri"

        not_found = repo.get_character_by_id(99999)
        assert not_found is None

    def test_role_repository(self, test_db_session, seed_catalog_data):
        repo = RoleRepositoryImpl(test_db_session)
        role_orm = seed_catalog_data["roles"][0]

        found = repo.get_role_by_id(role_orm.role_id)
        assert found is not None
        assert found.role_id == role_orm.role_id
        assert found.name == "Mid"

        not_found = repo.get_role_by_id(99999)
        assert not_found is None

    def test_rank_repository(self, test_db_session, seed_catalog_data):
        repo = RankRepositoryImpl(test_db_session)
        rank_orm = seed_catalog_data["ranks"][0]

        found = repo.get_rank_by_id(rank_orm.rank_id)
        assert found is not None
        assert found.rank_id == rank_orm.rank_id
        assert found.name == "Gold"
        assert found.value == 1000

        not_found = repo.get_rank_by_id(99999)
        assert not_found is None
