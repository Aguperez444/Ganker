import csv
import io
from datetime import datetime

import pytest

from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.models.videogame_orm import VideogameORM


class TestReportEndpointsIntegration:

    @pytest.fixture
    def report_data(self, test_db_session, password_hasher):
        """Crea dos videojuegos y varios perfiles de jugador distribuidos entre ellos."""
        lol = VideogameORM(name="League of Legends", icon_url="/media/lol.png", rank_per_role=True)
        valorant = VideogameORM(name="Valorant", icon_url="/media/val.png", rank_per_role=False)
        cs2 = VideogameORM(name="Counter-Strike 2", icon_url="/media/cs2.png", rank_per_role=False)
        test_db_session.add_all([lol, valorant, cs2])
        test_db_session.flush()

        players = []
        for index in range(3):
            player = UserORM(
                name=f"Player {index}",
                username=f"player{index}",
                mail=f"player{index}@example.com",
                password_hash=password_hasher.hash_password("Password123"),
                role="player",
            )
            test_db_session.add(player)
            players.append(player)
        test_db_session.flush()

        now = datetime(2026, 6, 15, 12, 0, 0)
        profiles = [
            # 3 perfiles para LoL
            GameProfileORM(player_id=players[0].user_id, videogame_id=lol.videogame_id, created_at=now),
            GameProfileORM(player_id=players[1].user_id, videogame_id=lol.videogame_id, created_at=now),
            GameProfileORM(player_id=players[2].user_id, videogame_id=lol.videogame_id, created_at=now),
            # 1 perfil para Valorant
            GameProfileORM(player_id=players[0].user_id, videogame_id=valorant.videogame_id, created_at=now),
        ]
        test_db_session.add_all(profiles)
        test_db_session.commit()

        return {"lol": lol, "valorant": valorant, "cs2": cs2, "players": players}

    # ---------------------------------------------------------
    # POST /api/v1/reports/game-profiles
    # ---------------------------------------------------------

    def test_generate_report_success_sorted_by_popularity(self, client, admin_auth_headers, report_data):
        response = client.post("/api/v1/reports/game-profiles", json={}, headers=admin_auth_headers)

        assert response.status_code == 201
        data = response.json()
        assert data["total_profiles"] == 4
        assert data["has_previous_report"] is False

        names = [item["videogame_name"] for item in data["items"]]
        assert names[0] == "League of Legends"
        assert data["items"][0]["profile_count"] == 3
        assert data["items"][0]["percentage"] == 75.0
        assert data["items"][1]["videogame_name"] == "Valorant"
        assert data["items"][1]["profile_count"] == 1
        assert data["items"][1]["percentage"] == 25.0
        # El videojuego sin perfiles también se lista, con 0
        assert "Counter-Strike 2" in names

    def test_generate_report_forbidden_for_player(self, client, player_auth_headers, report_data):
        response = client.post("/api/v1/reports/game-profiles", json={}, headers=player_auth_headers)
        assert response.status_code == 403

    def test_generate_report_unauthorized_without_token(self, client, report_data):
        response = client.post("/api/v1/reports/game-profiles", json={})
        assert response.status_code == 401

    def test_generate_report_with_previous_report_returns_variation(self, client, admin_auth_headers, report_data):
        first = client.post("/api/v1/reports/game-profiles", json={}, headers=admin_auth_headers)
        assert first.status_code == 201

        second = client.post("/api/v1/reports/game-profiles", json={}, headers=admin_auth_headers)
        assert second.status_code == 201
        data = second.json()

        assert data["has_previous_report"] is True
        assert data["previous_report_id"] == first.json()["report_id"]
        assert all(item["variation"] is not None for item in data["items"])
        assert all(item["trend"] == "estable" for item in data["items"])

    def test_generate_report_with_date_filter(self, client, admin_auth_headers, report_data, test_db_session):
        old_player = UserORM(
            name="Old Player",
            username="oldplayer",
            mail="old@example.com",
            password_hash="irrelevant",
            role="player",
        )
        test_db_session.add(old_player)
        test_db_session.flush()
        old_date = datetime(2026, 1, 1, 12, 0, 0)
        test_db_session.add(
            GameProfileORM(
                player_id=old_player.user_id,
                videogame_id=report_data["valorant"].videogame_id,
                created_at=old_date,
            )
        )
        test_db_session.commit()

        payload = {"start_date": "2026-06-01", "end_date": "2026-06-30"}
        response = client.post("/api/v1/reports/game-profiles", json=payload, headers=admin_auth_headers)

        assert response.status_code == 201
        data = response.json()
        # El perfil viejo de Valorant (enero) queda fuera del rango
        assert data["total_profiles"] == 4
        valorant = next(item for item in data["items"] if item["videogame_name"] == "Valorant")
        assert valorant["profile_count"] == 1

    def test_generate_report_start_before_previous_end_fails(self, client, admin_auth_headers, report_data):
        first = client.post(
            "/api/v1/reports/game-profiles",
            json={"start_date": "2026-06-01", "end_date": "2026-06-30"},
            headers=admin_auth_headers,
        )
        assert first.status_code == 201

        second = client.post(
            "/api/v1/reports/game-profiles",
            json={"start_date": "2026-06-15", "end_date": "2026-06-20"},
            headers=admin_auth_headers,
        )
        assert second.status_code == 400
        assert "fecha inicial" in second.json().get("error", "").lower()

    def test_generate_report_without_profiles_notifies_no_data(self, client, admin_auth_headers, seed_catalog_data):
        response = client.post("/api/v1/reports/game-profiles", json={}, headers=admin_auth_headers)

        assert response.status_code == 404
        assert "no hay datos" in response.json().get("error", "").lower()

    # ---------------------------------------------------------
    # GET /api/v1/reports/game-profiles/{report_id}/export
    # ---------------------------------------------------------

    def test_export_report_csv_integrity(self, client, admin_auth_headers, report_data):
        generated = client.post("/api/v1/reports/game-profiles", json={}, headers=admin_auth_headers)
        assert generated.status_code == 201
        report = generated.json()
        report_id = report["report_id"]

        exported = client.get(
            f"/api/v1/reports/game-profiles/{report_id}/export",
            headers=admin_auth_headers,
        )

        assert exported.status_code == 200
        assert "text/csv" in exported.headers["content-type"]
        assert "attachment" in exported.headers["content-disposition"]

        rows = list(csv.reader(io.StringIO(exported.text)))
        assert rows[0] == ["VIDEOJUEGO", "PERFILES", "PORCENTAJE", "VARIACION", "VARIACION_PORCENTAJE", "TENDENCIA"]

        # Cada videojuego del reporte aparece en el CSV con la misma cantidad de perfiles
        video_rows = {row[0]: int(row[1]) for row in rows[1:] if len(row) == 6 and row[0] not in ("", "TOTAL")}
        assert video_rows["League of Legends"] == 3
        assert video_rows["Valorant"] == 1
        assert video_rows["Counter-Strike 2"] == 0

        total_row = next(row for row in rows if row and row[0] == "TOTAL")
        assert int(total_row[1]) == report["total_profiles"]

    def test_export_report_not_found(self, client, admin_auth_headers):
        response = client.get("/api/v1/reports/game-profiles/99999/export", headers=admin_auth_headers)
        assert response.status_code == 404

    def test_export_report_forbidden_for_player(self, client, player_auth_headers, report_data):
        response = client.get("/api/v1/reports/game-profiles/1/export", headers=player_auth_headers)
        assert response.status_code == 403
