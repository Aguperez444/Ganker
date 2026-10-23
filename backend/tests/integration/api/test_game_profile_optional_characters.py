import pytest

from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.rank_orm import RankORM
from app.infrastructure.database.models.role_orm import RoleORM
from app.infrastructure.database.models.videogame_orm import VideogameORM


@pytest.mark.parametrize("character_fields", [{}, {"character_ids": []}], ids=["omitted", "empty"])
@pytest.mark.parametrize("has_characters", [False, True])
def test_create_profile_without_characters_depends_on_game_flag(
    client, player_auth_headers, seed_player, test_db_session, has_characters, character_fields
):
    videogame = VideogameORM(
        name="Test game", icon_url="/game.png", rank_per_role=False, has_characters=has_characters
    )
    test_db_session.add(videogame)
    test_db_session.flush()
    role = RoleORM(name="Player", videogame_id=videogame.videogame_id, icon_url="/role.png")
    rank = RankORM(name="Gold", value=1000, videogame_id=videogame.videogame_id, icon_url="/rank.png")
    test_db_session.add_all([role, rank])
    test_db_session.commit()

    response = client.post(
        "/api/v1/game_profiles/",
        json={
            "videogame_id": videogame.videogame_id,
            "roles": [{"role_id": role.role_id, "rank_id": rank.rank_id}],
            **character_fields,
        },
        headers=player_auth_headers,
    )

    profiles = test_db_session.query(GameProfileORM).filter_by(videogame_id=videogame.videogame_id).all()
    if has_characters:
        assert response.status_code == 422
        assert "personaje" in response.json()["error"].lower()
        assert profiles == []
    else:
        assert response.status_code == 201
        assert len(profiles) == 1
        profile = profiles[0]
        assert profile.game_profile_id == response.json()["profile_id"]
        assert profile.player_id == seed_player.user_id
        assert profile.character_associations == []
        assert len(profile.role_profiles) == 1
        assert profile.role_profiles[0].role_id == role.role_id
        assert profile.role_profiles[0].rank_id == rank.rank_id
