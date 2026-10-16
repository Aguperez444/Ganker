import pytest
from sqlalchemy.exc import IntegrityError

from app.application.use_cases.delete_game_profile import DeleteGameProfileUseCase
from app.application.use_cases.delete_user import DeleteUserUseCase
from app.application.use_cases.delete_videogame import DeleteVideogameUseCase
from app.domain.specifications.videogame_specification import ByVideogameSpecification
from app.infrastructure.database.models.character_orm import CharacterORM
from app.infrastructure.database.models.character_priority_orm import CharacterPriorityORM
from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.rank_orm import RankORM
from app.infrastructure.database.models.region_orm import RegionORM
from app.infrastructure.database.models.role_orm import RoleORM
from app.infrastructure.database.models.role_profile_orm import RoleProfileORM
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.models.videogame_orm import VideogameORM


class TestSoftDeleteCascadesAndQueries:

    def _create_profile_with_details(self, session, player_id, catalog):
        vg = catalog["videogame"]
        roles = catalog["roles"]
        ranks = catalog["ranks"]
        chars = catalog["characters"]

        region = RegionORM(name="LAS", videogame_id=vg.videogame_id)
        session.add(region)
        session.flush()

        gp = GameProfileORM(
            player_id=player_id,
            videogame_id=vg.videogame_id,
            region_id=region.region_id,
            in_game_name="TestPlayer#LAS",
        )
        session.add(gp)
        session.flush()

        rp1 = RoleProfileORM(game_profile_id=gp.game_profile_id, role_id=roles[0].role_id, rank_id=ranks[0].rank_id)
        rp2 = RoleProfileORM(game_profile_id=gp.game_profile_id, role_id=roles[1].role_id, rank_id=ranks[1].rank_id)
        cp1 = CharacterPriorityORM(game_profile_id=gp.game_profile_id, character_id=chars[0].character_id, priority=1)
        cp2 = CharacterPriorityORM(game_profile_id=gp.game_profile_id, character_id=chars[1].character_id, priority=2)
        session.add_all([rp1, rp2, cp1, cp2])
        session.commit()
        session.refresh(gp)
        return gp, region

    def test_videogame_soft_delete_cascade_and_filtering(
        self, test_uow, test_db_session, seed_player, seed_catalog_data
    ):
        gp, region = self._create_profile_with_details(test_db_session, seed_player.user_id, seed_catalog_data)
        vg_id = seed_catalog_data["videogame"].videogame_id

        # Execute soft delete of Videogame
        DeleteVideogameUseCase(test_uow).execute(vg_id)
        test_db_session.expire_all()

        # Verify DB rows still exist physically with deleted=True
        vg_orm = test_db_session.query(VideogameORM).filter_by(videogame_id=vg_id).first()
        assert vg_orm is not None and vg_orm.deleted is True

        for role_orm in test_db_session.query(RoleORM).filter_by(videogame_id=vg_id).all():
            assert role_orm.deleted is True
        for rank_orm in test_db_session.query(RankORM).filter_by(videogame_id=vg_id).all():
            assert rank_orm.deleted is True
        for char_orm in test_db_session.query(CharacterORM).filter_by(videogame_id=vg_id).all():
            assert char_orm.deleted is True
        for reg_orm in test_db_session.query(RegionORM).filter_by(videogame_id=vg_id).all():
            assert reg_orm.deleted is True

        gp_orm = test_db_session.query(GameProfileORM).filter_by(game_profile_id=gp.game_profile_id).first()
        assert gp_orm is not None and gp_orm.deleted is True
        for rp_orm in test_db_session.query(RoleProfileORM).filter_by(game_profile_id=gp.game_profile_id).all():
            assert rp_orm.deleted is True
        for cp_orm in test_db_session.query(CharacterPriorityORM).filter_by(game_profile_id=gp.game_profile_id).all():
            assert cp_orm.deleted is True

        # Verify repositories exclude soft-deleted entities
        with test_uow as uow:
            assert uow.videogame_repo.get_videogame_by_id(vg_id) is None
            assert uow.videogame_repo.get_all_videogames() == []
            assert uow.role_repo.get_roles_by_game_id(vg_id) == []
            assert uow.rank_repo.get_ranks_by_game_id(vg_id) == []
            assert uow.character_repo.get_characters_by_game_id(vg_id) == []
            assert uow.region_repo.get_regions_by_game_id(vg_id) == []
            assert uow.game_profile_repo.get_game_profile_by_id(gp.game_profile_id) is None

            # User's loaded profiles should also exclude the soft-deleted profile
            user_domain = uow.user_repo.get_user_by_id(seed_player.user_id)
            assert user_domain is not None
            assert user_domain.profiles == []

            # Specification search excludes soft-deleted profiles
            spec = ByVideogameSpecification(vg_id)
            assert uow.find_by_specification_repo.get_videogame_profiles(spec, skip=0, limit=10) == []

    def test_game_profile_soft_delete_cascade_and_re_creation(
        self, test_uow, test_db_session, seed_player, seed_catalog_data
    ):
        gp, _ = self._create_profile_with_details(test_db_session, seed_player.user_id, seed_catalog_data)
        vg_id = seed_catalog_data["videogame"].videogame_id

        DeleteGameProfileUseCase(test_uow).execute(gp.game_profile_id, player_id=seed_player.user_id)
        test_db_session.expire_all()

        # Verify soft-deleted in DB
        gp_orm = test_db_session.query(GameProfileORM).filter_by(game_profile_id=gp.game_profile_id).first()
        assert gp_orm is not None and gp_orm.deleted is True
        for rp_orm in test_db_session.query(RoleProfileORM).filter_by(game_profile_id=gp.game_profile_id).all():
            assert rp_orm.deleted is True
        for cp_orm in test_db_session.query(CharacterPriorityORM).filter_by(game_profile_id=gp.game_profile_id).all():
            assert cp_orm.deleted is True

        # Verify Player can create a new GameProfile for the same Videogame without uniqueness conflict
        new_gp = GameProfileORM(player_id=seed_player.user_id, videogame_id=vg_id, in_game_name="New#LAS")
        test_db_session.add(new_gp)
        test_db_session.commit()
        assert new_gp.game_profile_id != gp.game_profile_id

        # While creating a second ACTIVE GameProfile for the same (player_id, videogame_id) raises IntegrityError
        dup_gp = GameProfileORM(player_id=seed_player.user_id, videogame_id=vg_id, in_game_name="Dup#LAS")
        test_db_session.add(dup_gp)
        with pytest.raises(IntegrityError):
            test_db_session.flush()
        test_db_session.rollback()

    def test_user_soft_delete_cascade_and_uniqueness_reuse(
        self, test_uow, test_db_session, seed_player, seed_catalog_data
    ):
        gp, _ = self._create_profile_with_details(test_db_session, seed_player.user_id, seed_catalog_data)
        old_username = seed_player.username
        old_mail = seed_player.mail

        DeleteUserUseCase(test_uow).execute(target_user_id=seed_player.user_id, requester_id=seed_player.user_id)
        test_db_session.expire_all()

        user_orm = test_db_session.query(UserORM).filter_by(user_id=seed_player.user_id).first()
        assert user_orm is not None and user_orm.deleted is True

        gp_orm = test_db_session.query(GameProfileORM).filter_by(game_profile_id=gp.game_profile_id).first()
        assert gp_orm is not None and gp_orm.deleted is True

        # Re-registering with the same username and mail succeeds after soft delete
        re_registered = UserORM(
            name="John Reborn",
            username=old_username,
            mail=old_mail,
            password_hash="newhash",
            role="player",
        )
        test_db_session.add(re_registered)
        test_db_session.commit()
        assert re_registered.user_id != seed_player.user_id
