import logging
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi import Depends, FastAPI, WebSocket
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError
from starlette.websockets import WebSocketDisconnect

from app.domain.exceptions.moderation.ban_not_finished_exception import BanNotFinishedException
from app.domain.models.user_role import UserRole
from app.infrastructure.api.dependencies import auth, web_socket_auth


@pytest.fixture
def protected_endpoints(monkeypatch, jwt_service):
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.__exit__.return_value = False
    uow.user_repo.get_user_by_id.return_value = SimpleNamespace(banned=True)
    monkeypatch.setattr(auth.uow_factory_module, "uow_factory", lambda: uow)
    monkeypatch.setattr(auth, "token_service", jwt_service)
    monkeypatch.setattr(web_socket_auth, "token_service", jwt_service)
    access_token, *_ = jwt_service.generate_tokens(user_id=7, role=UserRole.PLAYER)

    app = FastAPI()
    reached = MagicMock()

    @app.exception_handler(auth.DomainException)
    async def domain_error_handler(request, exc):
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=exc.status_code, content={"error": exc.message})

    @app.get("/protected")
    def protected_http(user=Depends(auth.get_current_user_data)):
        reached()
        return user

    @app.websocket("/protected")
    async def protected_ws(websocket: WebSocket, user=Depends(web_socket_auth.get_current_user_data_ws)):
        reached()
        await websocket.accept()
        await websocket.send_json(user)
        await websocket.close()

    with TestClient(app) as client:
        yield client, access_token, uow, reached


@pytest.mark.parametrize("transport", ["http", "websocket"])
@pytest.mark.parametrize("stage", ["open", "lookup", "ban", "commit"])
@pytest.mark.parametrize("error_type", [OperationalError, RuntimeError])
def test_ban_check_failure_denies_access_and_logs_error(protected_endpoints, caplog, transport, stage, error_type):
    client, token, uow, reached = protected_endpoints
    error = (
        OperationalError("SELECT private_data", {}, RuntimeError("database unavailable"))
        if error_type is OperationalError else RuntimeError("unexpected failure")
    )
    failure_points = {
        "open": uow.__enter__,
        "lookup": uow.user_repo.get_user_by_id,
        "ban": uow.moderation_repo.unban_user_if_applicable,
        "commit": uow.__exit__,
    }
    failure_points[stage].side_effect = error
    message = "No se pudo verificar el estado de la cuenta. Intente nuevamente más tarde."

    with caplog.at_level(logging.ERROR):
        if transport == "http":
            response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
            assert response.status_code == 503
            assert response.json() == {"error": message}
        else:
            with pytest.raises(WebSocketDisconnect) as exc_info:
                with client.websocket_connect(f"/protected?token={token}"):
                    pytest.fail("La conexión no debe aceptarse si falla la verificación")
            assert exc_info.value.code == 1011
            assert exc_info.value.reason == message

    reached.assert_not_called()
    assert any(
        record.exc_info and record.exc_info[1] is error
        and record.getMessage() == "No se pudo verificar el baneo del usuario 7"
        for record in caplog.records
    )


@pytest.mark.parametrize("transport", ["http", "websocket"])
def test_active_ban_still_rejects_as_domain_error(protected_endpoints, caplog, transport):
    client, token, uow, reached = protected_endpoints
    error = BanNotFinishedException()
    uow.moderation_repo.unban_user_if_applicable.side_effect = error

    if transport == "http":
        response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == error.status_code
        assert response.json() == {"error": error.message}
    else:
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(f"/protected?token={token}"):
                pytest.fail("La conexión no debe aceptarse con un baneo vigente")
        assert exc_info.value.code == 1008
        assert exc_info.value.reason == error.message

    reached.assert_not_called()
    assert not caplog.records


@pytest.mark.parametrize("transport", ["http", "websocket"])
@pytest.mark.parametrize("banned", [False, True])
def test_successful_ban_check_allows_access(protected_endpoints, transport, banned):
    client, token, uow, reached = protected_endpoints
    uow.user_repo.get_user_by_id.return_value = SimpleNamespace(banned=banned)
    # Si banned=True, la comprobación exitosa representa un baneo vencido.
    if transport == "http":
        response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["user_id"] == 7
    else:
        with client.websocket_connect(f"/protected?token={token}") as websocket:
            assert websocket.receive_json()["user_id"] == 7

    reached.assert_called_once()
    if banned:
        uow.moderation_repo.unban_user_if_applicable.assert_called_once_with(7)
    else:
        uow.moderation_repo.unban_user_if_applicable.assert_not_called()
