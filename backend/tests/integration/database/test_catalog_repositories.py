import pytest
from typing import cast
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.domain.models.role import Role
from app.domain.models.rank import Rank
from app.infrastructure.database.repositories.role_profile_repository_impl import RoleProfileRepositoryImpl
from app.infrastructure.database.repositories.character_priority_repository_impl import CharacterPriorityRepositoryImpl
from app.infrastructure.database.repositories.videogame_repository_impl import VideogameRepositoryImpl
from app.infrastructure.database.repositories.character_repository_impl import CharacterRepositoryImpl
from app.infrastructure.database.repositories.role_repository_impl import RoleRepositoryImpl
from app.infrastructure.database.repositories.rank_repository_impl import RankRepositoryImpl
from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.role_profile_orm import RoleProfileORM
from app.infrastructure.database.models.character_priority_orm import CharacterPriorityORM


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

    def test_character_repository_crud(self, test_db_session, seed_catalog_data, seed_player):
        repo = CharacterRepositoryImpl(test_db_session)
        char_priority_repo = CharacterPriorityRepositoryImpl(test_db_session)
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

        # Get by name and videogame (case-insensitive and whitespace check)
        found_by_nv = repo.get_character_by_name_and_videogame("Ahri", vg_orm.videogame_id)
        assert found_by_nv is not None
        assert found_by_nv.character_id == char_orm.character_id

        found_by_nv_lower = repo.get_character_by_name_and_videogame("  ahri  ", vg_orm.videogame_id)
        assert found_by_nv_lower is not None
        assert found_by_nv_lower.character_id == char_orm.character_id

        found_by_nv_upper = repo.get_character_by_name_and_videogame("AHRI", vg_orm.videogame_id)
        assert found_by_nv_upper is not None
        assert found_by_nv_upper.character_id == char_orm.character_id

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

        # Character Priority tests: association and priority readjustment
        gp = GameProfileORM(player_id=seed_player.user_id, videogame_id=vg_orm.videogame_id)
        test_db_session.add(gp)
        test_db_session.flush()

        cp1 = CharacterPriorityORM(game_profile_id=gp.game_profile_id, character_id=seed_catalog_data["characters"][0].character_id, priority=1)
        cp2 = CharacterPriorityORM(game_profile_id=gp.game_profile_id, character_id=created.character_id, priority=2)
        cp3 = CharacterPriorityORM(game_profile_id=gp.game_profile_id, character_id=seed_catalog_data["characters"][1].character_id, priority=3)
        test_db_session.add_all([cp1, cp2, cp3])
        test_db_session.commit()

        assert char_priority_repo.count_associated_to_character(created.character_id) == 1

        # Delete and readjust for character (Teemo Omega, priority 2)
        char_priority_repo.delete_and_readjust_for_character(created.character_id)
        test_db_session.commit()

        assert char_priority_repo.count_associated_to_character(created.character_id) == 0
        remaining_cps = test_db_session.query(CharacterPriorityORM).filter(
            CharacterPriorityORM.game_profile_id == gp.game_profile_id
        ).order_by(CharacterPriorityORM.priority.asc()).all()
        assert len(remaining_cps) == 2
        assert remaining_cps[0].character_id == seed_catalog_data["characters"][0].character_id
        assert remaining_cps[0].priority == 1
        assert remaining_cps[1].character_id == seed_catalog_data["characters"][1].character_id
        assert remaining_cps[1].priority == 2

        # Delete character
        deleted = repo.delete_character(created.character_id)
        test_db_session.commit()
        assert deleted is True
        assert repo.get_character_by_id(created.character_id) is None
        assert repo.delete_character(99999) is False


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

        # Get by name and videogame (case-insensitive and whitespace check)
        found_role = repo.get_role_by_name_and_videogame("Mid", vg_orm.videogame_id)
        assert found_role is not None
        assert found_role.role_id == role_orm.role_id

        found_role_lower = repo.get_role_by_name_and_videogame("  mid  ", vg_orm.videogame_id)
        assert found_role_lower is not None
        assert found_role_lower.role_id == role_orm.role_id

        found_role_upper = repo.get_role_by_name_and_videogame("MID", vg_orm.videogame_id)
        assert found_role_upper is not None
        assert found_role_upper.role_id == role_orm.role_id

        assert repo.get_role_by_name_and_videogame("NonExistent", vg_orm.videogame_id) is None

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

        # Get by name and videogame (case-insensitive and whitespace check)
        found_rank = repo.get_rank_by_name_and_videogame("Gold", vg_orm.videogame_id)
        assert found_rank is not None
        assert found_rank.rank_id == rank_orm.rank_id

        found_rank_lower = repo.get_rank_by_name_and_videogame("  gold  ", vg_orm.videogame_id)
        assert found_rank_lower is not None
        assert found_rank_lower.rank_id == rank_orm.rank_id

        found_rank_upper = repo.get_rank_by_name_and_videogame("GOLD", vg_orm.videogame_id)
        assert found_rank_upper is not None
        assert found_rank_upper.rank_id == rank_orm.rank_id

        assert repo.get_rank_by_name_and_videogame("NonExistent", vg_orm.videogame_id) is None

        # Get by value and videogame
        found_by_val = repo.get_rank_by_value_and_videogame(1000, vg_orm.videogame_id)
        assert found_by_val is not None
        assert found_by_val.rank_id == rank_orm.rank_id
        assert repo.get_rank_by_value_and_videogame(99999, vg_orm.videogame_id) is None

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
