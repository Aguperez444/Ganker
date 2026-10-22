import logging
from unittest.mock import MagicMock

import pytest
from sqlalchemy.exc import OperationalError

from app.infrastructure.start import main


def test_health_checks_database_without_authentication(client, test_engine, monkeypatch):
    monkeypatch.setattr(main, "engine", test_engine)
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["content-type"] == "application/json"
    assert response.headers["cache-control"] == "no-store"


@pytest.mark.parametrize("stage", ["connect", "query"])
def test_health_returns_503_when_database_is_unavailable(client, monkeypatch, caplog, stage):
    engine = MagicMock()
    error = OperationalError("SELECT private_data", {}, RuntimeError("private connection details"))
    if stage == "connect":
        engine.connect.side_effect = error
    else:
        engine.connect.return_value.__enter__.return_value.execute.side_effect = error
    monkeypatch.setattr(main, "engine", engine)

    with caplog.at_level(logging.ERROR):
        response = client.get("/api/v1/health")

    assert response.status_code == 503
    assert response.json() == {"status": "unavailable"}
    assert response.headers["cache-control"] == "no-store"
    assert "private" not in response.text
    assert any(record.exc_info and record.exc_info[1] is error for record in caplog.records)
