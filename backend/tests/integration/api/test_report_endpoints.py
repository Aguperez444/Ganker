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

    def test_export_report_pdf(self, client, admin_auth_headers, report_data):
        generated = client.post("/api/v1/reports/game-profiles", json={}, headers=admin_auth_headers)
        report_id = generated.json()["report_id"]

        exported = client.get(
            f"/api/v1/reports/game-profiles/{report_id}/export?report_output_format=pdf",
            headers=admin_auth_headers,
        )

        assert exported.status_code == 200
        assert exported.headers["content-type"] == "application/pdf"
        assert "attachment" in exported.headers["content-disposition"]
        assert exported.headers["content-disposition"].endswith(".pdf")
        assert exported.content.startswith(b"%PDF")

    def test_export_report_excel_integrity(self, client, admin_auth_headers, report_data):
        from openpyxl import load_workbook

        generated = client.post("/api/v1/reports/game-profiles", json={}, headers=admin_auth_headers)
        report = generated.json()
        report_id = report["report_id"]

        exported = client.get(
            f"/api/v1/reports/game-profiles/{report_id}/export?report_output_format=excel",
            headers=admin_auth_headers,
        )

        assert exported.status_code == 200
        assert "spreadsheetml" in exported.headers["content-type"]
        assert exported.headers["content-disposition"].endswith(".xlsx")
        assert exported.content.startswith(b"PK")  # xlsx es un zip

        workbook = load_workbook(io.BytesIO(exported.content))
        worksheet = workbook.active

        header_row_index = next(
            row[0].row for row in worksheet.iter_rows(min_col=1, max_col=1)
            if row[0].value == "VIDEOJUEGO"
        )
        data = {
            worksheet.cell(row=row, column=1).value
            for row in range(header_row_index + 1, worksheet.max_row)
        }
        assert "League of Legends" in data
        assert "Valorant" in data
        assert "Counter-Strike 2" in data

        counts = {
            worksheet.cell(row=row, column=1).value: worksheet.cell(row=row, column=2).value
            for row in range(header_row_index + 1, worksheet.max_row)
        }
        assert counts["League of Legends"] == 3
        assert counts["Valorant"] == 1
        assert counts["Counter-Strike 2"] == 0

    def test_export_report_unsupported_format(self, client, admin_auth_headers, report_data):
        generated = client.post("/api/v1/reports/game-profiles", json={}, headers=admin_auth_headers)
        report_id = generated.json()["report_id"]

        response = client.get(
            f"/api/v1/reports/game-profiles/{report_id}/export?report_output_format=xml",
            headers=admin_auth_headers,
        )
        assert response.status_code == 400
        assert "no es soportado" in response.json().get("error", "").lower()

    # ---------------------------------------------------------
    # GET /api/v1/reports/game-profiles/last
    # ---------------------------------------------------------

    def test_get_last_report_without_reports(self, client, admin_auth_headers, seed_catalog_data):
        response = client.get("/api/v1/reports/game-profiles/last", headers=admin_auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["has_report"] is False
        assert data["report_id"] is None
        assert data["end_date"] is None
        assert data["suggested_start_date"] is None

    def test_get_last_report_after_generation(self, client, admin_auth_headers, report_data):
        generated = client.post(
            "/api/v1/reports/game-profiles",
            json={"start_date": "2026-06-01", "end_date": "2026-06-30"},
            headers=admin_auth_headers,
        )
        assert generated.status_code == 201
        report = generated.json()

        response = client.get("/api/v1/reports/game-profiles/last", headers=admin_auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["has_report"] is True
        assert data["report_id"] == report["report_id"]
        assert data["total_profiles"] == report["total_profiles"]
        assert data["end_date"].startswith("2026-06-30")
        # El próximo reporte debe empezar el día siguiente al fin del último
        assert data["suggested_start_date"] == "2026-07-01"

    def test_get_last_report_forbidden_for_player(self, client, player_auth_headers):
        response = client.get("/api/v1/reports/game-profiles/last", headers=player_auth_headers)
        assert response.status_code == 403

    # ---------------------------------------------------------
    # GET /api/v1/reports/game-profiles
    # ---------------------------------------------------------

    def test_list_reports_without_reports(self, client, admin_auth_headers, seed_catalog_data):
        response = client.get("/api/v1/reports/game-profiles", headers=admin_auth_headers)

        assert response.status_code == 200
        assert response.json()["reports"] == []

    def test_list_reports_after_generation(self, client, admin_auth_headers, report_data, test_db_session):
        # Perfil con fecha de julio para que el segundo reporte tenga datos en su rango
        test_db_session.add(
            GameProfileORM(
                player_id=report_data["players"][0].user_id,
                videogame_id=report_data["cs2"].videogame_id,
                created_at=datetime(2026, 7, 15, 12, 0, 0),
            )
        )
        test_db_session.commit()

        first = client.post(
            "/api/v1/reports/game-profiles",
            json={"start_date": "2026-06-01", "end_date": "2026-06-30"},
            headers=admin_auth_headers,
        )
        assert first.status_code == 201

        second = client.post(
            "/api/v1/reports/game-profiles",
            json={"start_date": "2026-07-01", "end_date": "2026-07-31"},
            headers=admin_auth_headers,
        )
        assert second.status_code == 201

        response = client.get("/api/v1/reports/game-profiles", headers=admin_auth_headers)

        assert response.status_code == 200
        reports = response.json()["reports"]
        assert len(reports) == 2
        # Del más reciente al más antiguo
        assert reports[0]["report_id"] == second.json()["report_id"]
        assert reports[1]["report_id"] == first.json()["report_id"]
        # Solo se exponen id y fechas
        assert set(reports[0].keys()) == {"report_id", "generated_at", "start_date", "end_date"}
        assert reports[0]["start_date"].startswith("2026-07-01")
        assert reports[0]["end_date"].startswith("2026-07-31")

    def test_list_reports_forbidden_for_player(self, client, player_auth_headers):
        response = client.get("/api/v1/reports/game-profiles", headers=player_auth_headers)
        assert response.status_code == 403

    def test_list_reports_unauthorized_without_token(self, client):
        response = client.get("/api/v1/reports/game-profiles")
        assert response.status_code == 401


    @pytest.mark.parametrize("with_previous_report", [False, True])
    def test_get_report_matches_saved_generation(self, client, admin_auth_headers, report_data,
                                                 test_db_session, with_previous_report):
        url = "/api/v1/reports/game-profiles"
        first = client.post(url, json={}, headers=admin_auth_headers)
        assert first.status_code == 201
        expected = first.json()
        if with_previous_report:
            second = client.post(url, json={}, headers=admin_auth_headers)
            assert second.status_code == 201
            expected = second.json()

        # Cambiar la población después de generar no debe cambiar la instantánea.
        existing = test_db_session.query(GameProfileORM).filter_by(
            videogame_id=report_data["lol"].videogame_id
        ).first()
        test_db_session.add(GameProfileORM(
            player_id=existing.player_id,
            videogame_id=report_data["cs2"].videogame_id,
            created_at=datetime(2026, 6, 16),
        ))
        test_db_session.commit()
        history = client.get(url, headers=admin_auth_headers).json()
        response = client.get(f"{url}/{expected['report_id']}", headers=admin_auth_headers)

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
        assert response.json() == expected
        assert client.get(url, headers=admin_auth_headers).json() == history
        assert client.get(f"{url}/{first.json()['report_id']}", headers=admin_auth_headers).json() == first.json()

    def test_get_report_with_period_as_owner(self, client, admin_auth_headers, owner_auth_headers, report_data):
        url = "/api/v1/reports/game-profiles"
        generated = client.post(url, json={"start_date": "2026-06-01", "end_date": "2026-06-30"},
                                headers=admin_auth_headers)
        assert generated.status_code == 201
        response = client.get(f"{url}/{generated.json()['report_id']}", headers=owner_auth_headers)
        assert response.status_code == 200
        assert response.json() == generated.json()

    @pytest.mark.parametrize("report_id, expected_status", [(99999, 404), ("invalid", 422)])
    def test_get_report_invalid_id(self, client, admin_auth_headers, report_id, expected_status):
        response = client.get(f"/api/v1/reports/game-profiles/{report_id}", headers=admin_auth_headers)
        assert response.status_code == expected_status

    def test_get_report_requires_admin(self, client, player_auth_headers):
        url = "/api/v1/reports/game-profiles/1"
        assert client.get(url).status_code == 401
        assert client.get(url, headers=player_auth_headers).status_code == 403
