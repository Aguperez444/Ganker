import pytest
from typing import cast
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.infrastructure.database.repositories.role_profile_repository_impl import RoleProfileRepositoryImpl
from app.infrastructure.database.repositories.videogame_repository_impl import VideogameRepositoryImpl
from app.infrastructure.database.repositories.character_repository_impl import CharacterRepositoryImpl
from app.infrastructure.database.repositories.role_repository_impl import RoleRepositoryImpl
from app.infrastructure.database.repositories.rank_repository_impl import RankRepositoryImpl
from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.role_profile_orm import RoleProfileORM


class TestCatalogRepositoriesIntegration:

    def test_videogame_repository_crud(self, test_db_session, seed_catalog_data):
        repo = VideogameRepositoryImpl(test_db_session)
        vg_orm = seed_catalog_data["videogame"]

        # Get by ID
        found = repo.get_videogame_by_id(vg_orm.videogame_id)
        assert found is not None
        assert found.videogame_id == vg_orm.videogame_id
        assert found.name == "League of Legends"
        assert found.icon_url == "/media/games/league_of_legends/icon.png"
        assert found.rank_per_role is True

        assert repo.get_videogame_by_id(99999) is None

        # Get by name (case-insensitive)
        found_by_name = repo.get_videogame_by_name("league of legends")
        assert found_by_name is not None
        assert found_by_name.videogame_id == vg_orm.videogame_id
        assert repo.get_videogame_by_name("nonexistent") is None

        # Register new videogame
        new_vg = Videogame(videogame_id=None, name="Valorant", icon_url="/val.png", rank_per_role=False)
        saved = repo.register_videogame(new_vg)
        test_db_session.commit()
        assert saved.videogame_id is not None
        assert saved.name == "Valorant"
        assert saved.rank_per_role is False

        # Update videogame
        saved.name = "Valorant Champions"
        saved.icon_url = "/val_new.png"
        saved.rank_per_role = True
        updated = repo.update_videogame(saved)
        test_db_session.commit()
        assert updated.name == "Valorant Champions"
        assert updated.icon_url == "/val_new.png"
        assert updated.rank_per_role is True

        # Get all
        all_games = repo.get_all_videogames()
        assert len(all_games) >= 2

    def test_character_repository_crud(self, test_db_session, seed_catalog_data):
        repo = CharacterRepositoryImpl(test_db_session)
        vg_orm = seed_catalog_data["videogame"]
        char_orm = seed_catalog_data["characters"][0]

        # Get by ID
        found = repo.get_character_by_id(char_orm.character_id)
        assert found is not None
        assert found.character_id == char_orm.character_id
        assert found.name == "Ahri"
        assert found.icon_url == "/media/games/league_of_legends/characters/ahri.png"

        assert repo.get_character_by_id(99999) is None

        # Get by game id
        chars_in_game = repo.get_characters_by_game_id(vg_orm.videogame_id)
        assert len(chars_in_game) == 3

        # Get by name and videogame
        found_by_nv = repo.get_character_by_name_and_videogame("Ahri", vg_orm.videogame_id)
        assert found_by_nv is not None
        assert found_by_nv.character_id == char_orm.character_id
        assert repo.get_character_by_name_and_videogame("NonExistent", vg_orm.videogame_id) is None

        # Create character
        vg_domain = Videogame(vg_orm.videogame_id, vg_orm.name, vg_orm.icon_url, vg_orm.rank_per_role)
        new_char = Character(None, "Teemo", vg_domain, "/teemo.png")
        created = repo.create_character(new_char)
        test_db_session.commit()
        assert created.character_id is not None
        assert created.name == "Teemo"

        # Update character
        created.name = "Teemo Omega"
        created.icon_url = "/teemo_omega.png"
        updated = repo.update_character(created)
        test_db_session.commit()
        assert updated.name == "Teemo Omega"
        assert updated.icon_url == "/teemo_omega.png"

    def test_role_repository_crud(self, test_db_session, seed_catalog_data):
        repo = RoleRepositoryImpl(test_db_session)
        vg_orm = seed_catalog_data["videogame"]
        role_orm = seed_catalog_data["roles"][0]

        # Get by ID
        found = repo.get_role_by_id(role_orm.role_id)
        assert found is not None
        assert found.role_id == role_orm.role_id
        assert found.name == "Mid"
        assert found.icon_url == "/media/games/league_of_legends/roles/mid.png"

        assert repo.get_role_by_id(99999) is None

        # Get by game id
        roles = repo.get_roles_by_game_id(vg_orm.videogame_id)
        assert len(roles) == 3

        # Save role
        vg_domain = Videogame(vg_orm.videogame_id, vg_orm.name, vg_orm.icon_url, vg_orm.rank_per_role)
        new_role = Role(None, "Jungler", vg_domain, "/jungle.png")
        saved = repo.save_role(new_role)
        test_db_session.commit()
        assert saved.role_id is not None
        assert saved.name == "Jungler"

        # Update role
        saved.name = "Jungle Carry"
        saved.icon_url = "/jungle_carry.png"
        updated = repo.update_role(saved)
        test_db_session.commit()
        assert updated.name == "Jungle Carry"
        assert updated.icon_url == "/jungle_carry.png"
        reloaded = repo.get_role_by_id(saved.role_id)
        assert reloaded.name == "Jungle Carry"
        assert reloaded.icon_url == "/jungle_carry.png"

    def test_rank_repository_crud(self, test_db_session, seed_catalog_data, seed_player):
        repo = RankRepositoryImpl(test_db_session)
        role_porfile_repo = RoleProfileRepositoryImpl(test_db_session)
        vg_orm = seed_catalog_data["videogame"]
        rank_orm = seed_catalog_data["ranks"][0]

        # Get by ID
        found = repo.get_rank_by_id(rank_orm.rank_id)
        assert found is not None
        assert found.rank_id == rank_orm.rank_id
        assert found.name == "Gold"
        assert found.value == 1000
        assert found.icon_url == "/media/games/league_of_legends/ranks/gold.png"

        assert repo.get_rank_by_id(99999) is None

        # Get by game id
        ranks = repo.get_ranks_by_game_id(vg_orm.videogame_id)
        assert len(ranks) == 3

        # Save rank
        vg_domain = Videogame(vg_orm.videogame_id, vg_orm.name, vg_orm.icon_url, vg_orm.rank_per_role)
        new_rank = Rank(None, "Master", 4000, vg_domain, "/master.png")
        saved = repo.save_rank(new_rank)
        test_db_session.commit()
        assert saved.rank_id is not None
        assert saved.name == "Master"
        assert saved.value == 4000

        # Update rank
        saved.name = "Grandmaster"
        saved.value = 4500
        saved.icon_url = "/grandmaster.png"
        updated = repo.update_rank(saved)
        test_db_session.commit()
        assert updated.name == "Grandmaster"
        assert updated.value == 4500
        assert updated.icon_url == "/grandmaster.png"


        # Verify from database
        refetched = repo.get_rank_by_id(cast(int, saved.rank_id))
        assert refetched is not None
        assert refetched.name == "Grandmaster"
        assert refetched.value == 4500
        assert refetched.icon_url == "/grandmaster.png"

        # Count associated profiles before any association
        assert role_porfile_repo.count_associated_to_rank(cast(int, saved.rank_id)) == 0

        # Create an associated role_profile
        gp = GameProfileORM(player_id=seed_player.user_id, videogame_id=vg_orm.videogame_id)
        test_db_session.add(gp)
        test_db_session.flush()

        rp = RoleProfileORM(
            game_profile_id=gp.game_profile_id,
            role_id=seed_catalog_data["roles"][0].role_id,
            rank_id=cast(int, saved.rank_id)
        )
        test_db_session.add(rp)
        test_db_session.commit()

        # Count associated profiles now
        assert role_porfile_repo.count_associated_to_rank(cast(int, saved.rank_id)) == 1

        # Reassign associated profiles
        reassigned_count = role_porfile_repo.reassign_associated_to_rank(cast(int, saved.rank_id), rank_orm.rank_id)
        test_db_session.commit()
        assert reassigned_count == 1
        assert role_porfile_repo.count_associated_to_rank(cast(int, saved.rank_id)) == 0
        assert role_porfile_repo.count_associated_to_rank(rank_orm.rank_id) == 1

        # Delete rank
        deleted = repo.delete_rank(cast(int, saved.rank_id))
        test_db_session.commit()
        assert deleted is True
        assert repo.get_rank_by_id(cast(int, saved.rank_id)) is None
