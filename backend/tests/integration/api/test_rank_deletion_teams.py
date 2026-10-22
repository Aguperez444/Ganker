import pytest

from app.infrastructure.database.models import (
    ConversationORM, GameProfileORM, RankORM, RoleProfileORM, TeamORM,
)


@pytest.fixture(autouse=True)
def enforce_foreign_keys(test_engine):
    # Las pruebas de borrado deben comprobar las mismas referencias que PostgreSQL.
    with test_engine.connect() as connection:
        connection.exec_driver_sql("PRAGMA foreign_keys=ON")
        assert connection.exec_driver_sql("PRAGMA foreign_keys").scalar() == 1
    yield
    with test_engine.connect() as connection:
        connection.exec_driver_sql("PRAGMA foreign_keys=OFF")


def _team(session, game_id, min_rank_id, max_rank_id, is_active=True):
    conversation = ConversationORM(name="Chat del equipo", type=2)
    session.add(conversation)
    session.flush()
    team = TeamORM(
        name="Equipo", allow_other_regions=True, videogame_id=game_id,
        min_rank_id=min_rank_id, max_rank_id=max_rank_id,
        conversation_id=conversation.conversation_id, is_active=is_active,
    )
    session.add(team)
    session.flush()
    return team


@pytest.mark.parametrize("is_active", [True, False])
@pytest.mark.parametrize("reference, rank_index, target_index", [
    ("min", 0, 1), ("min", 1, 0),
    ("max", 1, 0), ("max", 2, 1),
    ("both", 0, 1), ("both", 1, 0),
])
def test_delete_rank_reassigns_team_requirements(
    client, admin_auth_headers, seed_catalog_data, test_db_session,
    reference, rank_index, target_index, is_active,
):
    ranks = seed_catalog_data["ranks"]
    rank_id = ranks[rank_index].rank_id
    target_rank_id = ranks[target_index].rank_id
    min_rank_id = rank_id if reference in ("min", "both") else ranks[0].rank_id
    max_rank_id = rank_id if reference in ("max", "both") else ranks[2].rank_id
    game_id = seed_catalog_data["videogame"].videogame_id
    team = _team(test_db_session, game_id, min_rank_id, max_rank_id, is_active)
    other_ranks = [rank.rank_id for rank in ranks if rank.rank_id != rank_id]
    unrelated = _team(test_db_session, game_id, other_ranks[0], other_ranks[1])
    conversation_id = team.conversation_id
    test_db_session.commit()

    response = client.delete(f"/api/v1/ranks/{rank_id}", headers=admin_auth_headers)

    assert response.status_code == 200, response.text
    test_db_session.expire_all()
    assert test_db_session.get(RankORM, rank_id) is None
    test_db_session.refresh(team)
    assert team.min_rank_id == (target_rank_id if min_rank_id == rank_id else min_rank_id)
    assert team.max_rank_id == (target_rank_id if max_rank_id == rank_id else max_rank_id)
    assert team.min_rank.value <= team.max_rank.value
    assert team.is_active is is_active
    assert team.conversation_id == conversation_id
    assert test_db_session.get(ConversationORM, conversation_id) is not None
    test_db_session.refresh(unrelated)
    assert (unrelated.min_rank_id, unrelated.max_rank_id) == tuple(other_ranks)
    assert test_db_session.connection().exec_driver_sql("PRAGMA foreign_key_check").all() == []


def test_delete_rank_reassigns_teams_and_active_and_deleted_profiles_together(
    client, admin_auth_headers, seed_catalog_data, seed_player, test_db_session,
):
    rank_id = seed_catalog_data["ranks"][1].rank_id
    target_rank_id = seed_catalog_data["ranks"][0].rank_id
    game_id = seed_catalog_data["videogame"].videogame_id
    team = _team(test_db_session, game_id, rank_id, rank_id, is_active=False)
    game_profile = GameProfileORM(player_id=seed_player.user_id, videogame_id=game_id)
    test_db_session.add(game_profile)
    test_db_session.flush()
    profiles = [RoleProfileORM(
        game_profile_id=game_profile.game_profile_id,
        role_id=seed_catalog_data["roles"][index].role_id,
        rank_id=rank_id, deleted=deleted,
    ) for index, deleted in enumerate([False, True])]
    test_db_session.add_all(profiles)
    test_db_session.commit()

    response = client.delete(f"/api/v1/ranks/{rank_id}", headers=admin_auth_headers)

    assert response.status_code == 200, response.text
    test_db_session.expire_all()
    test_db_session.refresh(team)
    assert (team.min_rank_id, team.max_rank_id) == (target_rank_id, target_rank_id)
    for profile, deleted in zip(profiles, [False, True]):
        test_db_session.refresh(profile)
        assert profile.rank_id == target_rank_id
        assert profile.deleted is deleted
    assert test_db_session.get(RankORM, rank_id) is None


@pytest.mark.parametrize("is_active", [True, False])
def test_delete_last_rank_referenced_only_by_team_returns_400(
    client, admin_auth_headers, seed_catalog_data, test_db_session, is_active,
):
    rank_id = seed_catalog_data["ranks"][0].rank_id
    test_db_session.query(RankORM).filter(RankORM.rank_id != rank_id).delete(
        synchronize_session="fetch",
    )
    team = _team(
        test_db_session, seed_catalog_data["videogame"].videogame_id,
        rank_id, rank_id, is_active,
    )
    test_db_session.commit()

    response = client.delete(f"/api/v1/ranks/{rank_id}", headers=admin_auth_headers)

    assert response.status_code == 400, response.text
    assert "no existe otro rango" in response.json()["error"].lower()
    test_db_session.expire_all()
    assert test_db_session.get(RankORM, rank_id) is not None
    test_db_session.refresh(team)
    assert (team.min_rank_id, team.max_rank_id) == (rank_id, rank_id)
    assert team.is_active is is_active
