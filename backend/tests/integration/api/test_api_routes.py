import pytest

from app.infrastructure.start.main import app


@pytest.mark.parametrize("path,response_key", [
    ("/api/v1/moderation/reported_players", "reports"),
    ("/api/v1/moderation/banned-players", "list_banned_players"),
])
def test_moderation_lists_accept_get_without_body(client, admin_auth_headers, path, response_key):
    response = client.get(path, headers=admin_auth_headers)
    assert response.status_code == 200
    assert response.json() == {response_key: []}
    assert client.post(path, json={}, headers=admin_auth_headers).status_code == 405


@pytest.mark.parametrize("path,params", [
    ("/api/v1/moderation/reported_players", {"min_create_date": "invalid-date"}),
    ("/api/v1/moderation/banned-players", {"min_date_expire": "invalid-date"}),
    ("/api/v1/moderation/reported_players", {"skip": "invalid-integer"}),
    ("/api/v1/moderation/banned-players", {"limit": "invalid-integer"}),
])
def test_moderation_lists_validate_query_parameters(client, admin_auth_headers, path, params):
    response = client.get(path, params=params, headers=admin_auth_headers)
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"][0] == "query"


@pytest.mark.parametrize("path", [
    "/api/v1/moderation/reported_players",
    "/api/v1/moderation/banned-players",
])
def test_moderation_lists_require_authentication(client, path):
    assert client.get(path).status_code == 401


def test_openapi_keeps_auth_prefix_and_query_filters(client):
    schema = app.openapi()
    assert "/auth/v1/login" in schema["paths"]
    oauth_flows = schema["components"]["securitySchemes"]["OAuth2PasswordBearer"]["flows"]
    assert oauth_flows["password"]["tokenUrl"] == "/auth/v1/login"
    for path, date_filter in [
        ("/api/v1/moderation/reported_players", "min_create_date"),
        ("/api/v1/moderation/banned-players", "min_date_expire"),
    ]:
        operations = schema["paths"][path]
        assert "post" not in operations
        assert "requestBody" not in operations["get"]
        parameters = operations["get"]["parameters"]
        assert all(parameter["in"] == "query" for parameter in parameters)
        assert {"skip", "limit", date_filter} <= {parameter["name"] for parameter in parameters}


@pytest.mark.parametrize("path", [
    "/api/v1/auth/login",
    "/moderation/",
    "/moderation/reported_players",
    "/moderation/banned-players",
])
def test_replaced_routes_are_not_registered(client, path):
    assert client.post(path, json={}).status_code == 404
