import pytest

from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.rank_orm import RankORM
from app.infrastructure.database.models.role_profile_orm import RoleProfileORM


@pytest.mark.parametrize("deleted_flags", [(False,), (True,), (False, True)])
@pytest.mark.parametrize("rank_index, target_index", [(0, 1), (1, 0)])
def test_delete_rank_reassigns_all_profiles(
    client, admin_auth_headers, seed_catalog_data, seed_player, test_db_session,
    deleted_flags, rank_index, target_index,
):
    rank_id = seed_catalog_data["ranks"][rank_index].rank_id
    target_rank_id = seed_catalog_data["ranks"][target_index].rank_id
    other_rank_id = seed_catalog_data["ranks"][2].rank_id
    game_profile = GameProfileORM(
        player_id=seed_player.user_id,
        videogame_id=seed_catalog_data["videogame"].videogame_id,
    )
    test_db_session.add(game_profile)
    test_db_session.flush()
    profiles = [
        RoleProfileORM(
            game_profile_id=game_profile.game_profile_id,
            role_id=seed_catalog_data["roles"][index].role_id,
            rank_id=rank_id,
            deleted=deleted,
        )
        for index, deleted in enumerate(deleted_flags)
    ]
    unrelated_profile = RoleProfileORM(
        game_profile_id=game_profile.game_profile_id,
        role_id=seed_catalog_data["roles"][2].role_id,
        rank_id=other_rank_id,
    )
    test_db_session.add_all([*profiles, unrelated_profile])
    test_db_session.commit()

    response = client.delete(f"/api/v1/ranks/{rank_id}", headers=admin_auth_headers)

    assert response.status_code == 200, response.text
    test_db_session.expire_all()
    assert test_db_session.get(RankORM, rank_id) is None
    for profile, deleted in zip(profiles, deleted_flags):
        test_db_session.refresh(profile)
        assert profile.rank_id == target_rank_id
        assert profile.deleted is deleted
    test_db_session.refresh(unrelated_profile)
    assert unrelated_profile.rank_id == other_rank_id
    assert unrelated_profile.deleted is False


@pytest.mark.parametrize("deleted_flags", [(True,), (False, True)])
def test_delete_last_rank_with_deleted_profiles_returns_business_error(
    client, admin_auth_headers, seed_catalog_data, seed_player, test_db_session,
    deleted_flags,
):
    rank_id = seed_catalog_data["ranks"][0].rank_id
    test_db_session.query(RankORM).filter(RankORM.rank_id != rank_id).delete(
        synchronize_session="fetch"
    )
    game_profile = GameProfileORM(
        player_id=seed_player.user_id,
        videogame_id=seed_catalog_data["videogame"].videogame_id,
    )
    test_db_session.add(game_profile)
    test_db_session.flush()
    profiles = [
        RoleProfileORM(
            game_profile_id=game_profile.game_profile_id,
            role_id=seed_catalog_data["roles"][index].role_id,
            rank_id=rank_id,
            deleted=deleted,
        )
        for index, deleted in enumerate(deleted_flags)
    ]
    test_db_session.add_all(profiles)
    test_db_session.commit()

    response = client.delete(f"/api/v1/ranks/{rank_id}", headers=admin_auth_headers)

    assert response.status_code == 400, response.text
    assert "no existe otro rango" in response.json()["error"].lower()
    test_db_session.expire_all()
    assert test_db_session.get(RankORM, rank_id) is not None
    for profile, deleted in zip(profiles, deleted_flags):
        test_db_session.refresh(profile)
        assert profile.rank_id == rank_id
        assert profile.deleted is deleted
