import pytest

from app.infrastructure.database.models.user_orm import UserORM


@pytest.fixture
def searchable_users(test_db_session):
    users = [
        UserORM(username=username, name="Jugador", mail=f"user{index}@example.com",
                role="player", deleted=deleted, banned=banned)
        for index, (username, deleted, banned) in enumerate([
            ("juancitopro", False, False),
            ("JuanCito123", False, False),
            ("superjuan", False, False),
            ("pedro", False, False),
            ("juan_deleted", True, False),
            ("juan_banned", False, True),
            ("juan_special%", False, False),
            ("juan_special_", False, False),
        ])
    ]
    test_db_session.add_all(users)
    test_db_session.commit()
    return users


def test_search_users_matches_partial_username_and_returns_public_summary(
    client, player_auth_headers, searchable_users,
):
    response = client.get("/api/v1/users/search", params={"username": "  JUAN  "}, headers=player_auth_headers)

    assert response.status_code == 200
    results = response.json()
    assert [user["username"] for user in results] == [
        "juan_special%", "juan_special_", "JuanCito123", "juancitopro", "superjuan",
    ]
    assert all(set(user) == {"user_id", "username", "name", "icon_url"} for user in results)
    assert {user["user_id"] for user in results} == {
        user.user_id for user in searchable_users if "juan" in user.username.lower() and not user.deleted and not user.banned
    }


def test_search_users_paginates(client, player_auth_headers, searchable_users):
    response = client.get("/api/v1/users/search", params={"username": "juan", "page": 2, "size": 2}, headers=player_auth_headers)

    assert response.status_code == 200
    assert [user["username"] for user in response.json()] == ["JuanCito123", "juancitopro"]


@pytest.mark.parametrize("term,expected", [
    ("unknown", []),
    ("%", ["juan_special%"]),
    ("special_", ["juan_special_"]),
])
def test_search_users_handles_missing_matches_and_literal_wildcards(
    client, player_auth_headers, searchable_users, term, expected,
):
    response = client.get("/api/v1/users/search", params={"username": term}, headers=player_auth_headers)

    assert response.status_code == 200
    assert [user["username"] for user in response.json()] == expected


@pytest.mark.parametrize("params", [
    {}, {"username": ""}, {"username": "   "},
    {"username": "juan", "page": 0},
    {"username": "juan", "size": 0},
    {"username": "juan", "size": 101},
])
def test_search_users_validates_query(client, player_auth_headers, params):
    response = client.get("/api/v1/users/search", params=params, headers=player_auth_headers)
    assert response.status_code == 422


def test_search_users_requires_authentication(client):
    assert client.get("/api/v1/users/search", params={"username": "juan"}).status_code == 401
