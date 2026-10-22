from datetime import datetime, timedelta
import pytest

from app.domain.models.report_reason import ReportReason
from app.domain.models.report_status import ReportStatus

from app.domain.models.user_role import UserRole
from app.infrastructure.database.models.conversation_orm import ConversationORM
from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.player_report_orm import PlayerReportORM
from app.infrastructure.database.models.region_orm import RegionORM
from app.infrastructure.database.models.team_member_role_orm import TeamMemberRoleORM
from app.infrastructure.database.models.team_orm import TeamORM
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.models.user_ban_record_orm import UserBanRecordORM


@pytest.mark.parametrize("actor_role,target_role,expected", [
    ("player", "player", 403),
    ("admin", "player", 200),
    ("admin", "admin", 403),
    ("admin", "owner", 403),
    ("owner", "player", 200),
    ("owner", "admin", 200),
    ("owner", "owner", 403),
])
def test_ban_respects_role_hierarchy(
    client, seed_admin, seed_player, test_db_session, jwt_service,
    actor_role, target_role, expected,
):
    seed_admin.role = actor_role
    seed_player.role = target_role
    test_db_session.commit()
    access_token, *_ = jwt_service.generate_tokens(seed_admin.user_id, UserRole(actor_role))
    response = client.post("/moderation/ban", json={
        "player_id": seed_player.user_id, "reason": "Abuso", "duration_days": 1,
    }, headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == expected
    test_db_session.expire_all()
    assert seed_player.banned is (expected == 200)
    assert test_db_session.query(UserBanRecordORM).count() == (1 if expected == 200 else 0)


def test_ban_checks_current_database_role_despite_stale_admin_token(
    client, admin_auth_headers, seed_admin, seed_player, test_db_session,
):
    seed_admin.role = "player"
    test_db_session.commit()
    response = client.post("/moderation/ban", json={
        "player_id": seed_player.user_id, "reason": "Abuso", "duration_days": 1,
    }, headers=admin_auth_headers)
    assert response.status_code == 403
    assert test_db_session.query(UserBanRecordORM).count() == 0


@pytest.mark.parametrize("changes", [
    {"duration_days": -1}, {"duration_days": 0}, {"duration_days": 1.5},
    {"reason": "x" * 501}, {"reason": ""}, {"reason": "   "},
    {"player_id": 0},
])
def test_ban_rejects_invalid_input(client, admin_auth_headers, seed_player, test_db_session, changes):
    payload = {"player_id": seed_player.user_id, "reason": "Abuso", "duration_days": 7}
    payload.update(changes)
    response = client.post("/moderation/ban", json=payload, headers=admin_auth_headers)
    assert response.status_code == 422
    assert test_db_session.query(UserBanRecordORM).count() == 0


@pytest.mark.parametrize("duration", [1, 3651, 365000])
def test_ban_accepts_positive_durations_including_a_thousand_years(client, admin_auth_headers, seed_player, test_db_session, duration):
    response = client.post("/moderation/ban", json={
        "player_id": seed_player.user_id, "reason": "x" * 500, "duration_days": duration,
    }, headers=admin_auth_headers)
    assert response.status_code == 200
    record = test_db_session.query(UserBanRecordORM).one()
    assert record.expires_at - record.created_at == timedelta(days=duration)


@pytest.mark.parametrize("duration", [365 * 10000, 10**30])
def test_ban_caps_unrepresentable_expiration_without_overflow(
    client, admin_auth_headers, seed_player, test_db_session, duration,
):
    response = client.post("/moderation/ban", json={
        "player_id": seed_player.user_id, "reason": "Baneo permanente", "duration_days": duration,
    }, headers=admin_auth_headers)
    assert response.status_code == 200
    record = test_db_session.query(UserBanRecordORM).one()
    assert record.expires_at == datetime.max
    test_db_session.expire_all()
    assert seed_player.banned is True
    # El registro se puede consultar y el usuario continúa bloqueado.
    assert client.post("/moderation/banned-players", json={}, headers=admin_auth_headers).status_code == 200
    login = client.post("/auth/v1/login", data={"username": seed_player.mail, "password": "Password123"})
    assert login.status_code == 400


def _create_user(
    session,
    password_hasher,
    username: str,
    mail: str,
    role: str = "player",
    banned: bool = False,
) -> UserORM:
    user = UserORM(
        name=f"Name {username}",
        username=username,
        mail=mail,
        password_hash=password_hasher.hash_password("Password123"),
        role=role,
        icon_url=f"/media/users/icons/{username}.png",
        banned=banned,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


class TestPlayerReportingIntegration:
    """Tests de integración para el reporte de jugadores (Tarea 3.1)."""

    def test_user_can_report_another_player_successfully(
        self, client, test_db_session, seed_player, password_hasher, player_auth_headers
    ):
        target_player = _create_user(
            test_db_session, password_hasher, username="toxicplayer", mail="toxic@example.com"
        )

        payload = {
            "reported_id": target_player.user_id,
            "reason": "cheating",
            "description": "Uso de scripts evidentes durante la partida",
        }
        response = client.post("/moderation/", json=payload, headers=player_auth_headers)

        assert response.status_code == 201
        data = response.json()
        assert data["reporter_id"] == seed_player.user_id
        assert data["reported_id"] == target_player.user_id
        assert data["reason"] == "cheating"
        assert data["status"] == "pending"
        assert data["description"] == "Uso de scripts evidentes durante la partida"

        report_in_db = (
            test_db_session.query(PlayerReportORM)
            .filter(PlayerReportORM.id == data["report_id"])
            .first()
        )
        assert report_in_db is not None
        assert report_in_db.status == ReportStatus.PENDING

    def test_user_cannot_report_themselves_returns_400(
        self, client, seed_player, player_auth_headers
    ):
        payload = {
            "reported_id": seed_player.user_id,
            "reason": "spamming",
            "description": "Intentando reportarme a mí mismo",
        }
        response = client.post("/moderation/", json=payload, headers=player_auth_headers)

        assert response.status_code == 400
        assert "No se puede reportar a uno mismo" in response.json().get("error", "")

    @pytest.mark.parametrize(
        "reason_value",
        [
            "cheating",
            "abusive_behavior",
            "spamming",
            "inappropriate_content",
            "other",
        ],
    )
    def test_report_player_accepts_all_valid_enum_reasons(
        self, client, test_db_session, password_hasher, player_auth_headers, reason_value
    ):
        target = _create_user(
            test_db_session,
            password_hasher,
            username=f"target_{reason_value[:8]}",
            mail=f"target_{reason_value}@example.com",
        )
        payload = {
            "reported_id": target.user_id,
            "reason": reason_value,
            "description": f"Reporte por {reason_value}",
        }
        response = client.post("/moderation/", json=payload, headers=player_auth_headers)
        assert response.status_code == 201
        assert response.json()["reason"] == reason_value

    def test_report_player_rejects_invalid_enum_reason(
        self, client, test_db_session, password_hasher, player_auth_headers
    ):
        target = _create_user(
            test_db_session, password_hasher, username="targetinvalid", mail="targetinvalid@example.com"
        )
        payload = {
            "reported_id": target.user_id,
            "reason": "motivo_inexistente_no_valido",
            "description": "Razón fuera del Enum",
        }
        response = client.post("/moderation/", json=payload, headers=player_auth_headers)
        assert response.status_code in (400, 422)


class TestBanSystemAndSpecificationsIntegration:
    """Tests de integración para el sistema de baneos y búsqueda por Specifications (Tarea 3.2)."""

    def test_admin_can_ban_user_and_pending_reports_are_resolved(
        self, client, test_db_session, seed_player, seed_admin, player_auth_headers, admin_auth_headers, password_hasher
    ):
        offender = _create_user(
            test_db_session, password_hasher, username="offender1", mail="offender1@example.com"
        )

        # Primero creamos un reporte pendiente contra el jugador
        report_res = client.post(
            "/moderation/",
            json={
                "reported_id": offender.user_id,
                "reason": "abusive_behavior",
                "description": "Insultos constantes",
            },
            headers=player_auth_headers,
        )
        assert report_res.status_code == 201
        report_id = report_res.json()["report_id"]

        # El administrador banea al jugador
        ban_res = client.post(
            "/moderation/ban",
            json={
                "player_id": offender.user_id,
                "reason": "Comportamiento tóxico comprobado",
                "duration_days": 14,
            },
            headers=admin_auth_headers,
        )
        assert ban_res.status_code == 200

        test_db_session.expire_all()
        updated_offender = test_db_session.query(UserORM).filter(UserORM.user_id == offender.user_id).first()
        assert updated_offender.banned is True

        ban_record = (
            test_db_session.query(UserBanRecordORM)
            .filter(UserBanRecordORM.banned_user_id == offender.user_id)
            .first()
        )
        assert ban_record is not None
        assert ban_record.banned_by_user_id == seed_admin.user_id
        assert ban_record.reason == "Comportamiento tóxico comprobado"

        resolved_report = test_db_session.query(PlayerReportORM).filter(PlayerReportORM.id == report_id).first()
        assert resolved_report.status == ReportStatus.RESOLVED
        assert resolved_report.resolver_id == seed_admin.user_id
        assert resolved_report.resolved_at is not None

    def test_admin_can_manually_unban_player(
        self, client, test_db_session, seed_admin, admin_auth_headers, password_hasher
    ):
        offender = _create_user(
            test_db_session, password_hasher, username="to_unban", mail="tounban@example.com"
        )
        client.post(
            "/moderation/ban",
            json={"player_id": offender.user_id, "reason": "Spam", "duration_days": 5},
            headers=admin_auth_headers,
        )

        unban_res = client.post(f"/moderation/{offender.user_id}/unban", headers=admin_auth_headers)
        assert unban_res.status_code == 200

        test_db_session.expire_all()
        refreshed = test_db_session.query(UserORM).filter(UserORM.user_id == offender.user_id).first()
        assert refreshed.banned is False

        # Intentar desbanear nuevamente a un usuario que ya no está baneado lanza 400
        second_unban = client.post(f"/moderation/{offender.user_id}/unban", headers=admin_auth_headers)
        assert second_unban.status_code == 400

    def test_search_banned_players_with_cross_filters(
        self, client, test_db_session, seed_admin, admin_auth_headers, password_hasher
    ):
        admin_two = _create_user(
            test_db_session, password_hasher, username="mod_carlos", mail="carlos@example.com", role="admin"
        )
        banned_one = _create_user(
            test_db_session, password_hasher, username="hacker_luis", mail="luis@example.com", banned=True
        )
        banned_two = _create_user(
            test_db_session, password_hasher, username="flamer_pedro", mail="pedro@example.com", banned=True
        )
        banned_three = _create_user(
            test_db_session, password_hasher, username="hacker_maria", mail="maria@example.com", banned=True
        )

        base_time = datetime(2026, 5, 10, 12, 0, 0)
        rec1 = UserBanRecordORM(
            banned_user_id=banned_one.user_id,
            banned_by_user_id=seed_admin.user_id,  # username: adminuser
            reason="Uso de cheats",
            created_at=base_time - timedelta(days=10),
            expires_at=base_time + timedelta(days=20),
        )
        rec2 = UserBanRecordORM(
            banned_user_id=banned_two.user_id,
            banned_by_user_id=admin_two.user_id,  # username: mod_carlos
            reason="Insultos graves",
            created_at=base_time - timedelta(days=2),
            expires_at=base_time + timedelta(days=5),
        )
        rec3 = UserBanRecordORM(
            banned_user_id=banned_three.user_id,
            banned_by_user_id=admin_two.user_id,  # username: mod_carlos
            reason="Uso de cheats",
            created_at=base_time,
            expires_at=base_time + timedelta(days=30),
        )
        test_db_session.add_all([rec1, rec2, rec3])
        test_db_session.commit()

        # 1. Filtro por nombre de admin (banned_by)
        res_by_admin = client.post(
            "/moderation/banned-players",
            json={"banned_by": "mod_carlos"},
            headers=admin_auth_headers,
        )
        assert res_by_admin.status_code == 200
        items_admin = res_by_admin.json()["list_banned_players"]
        assert len(items_admin) == 2
        assert {item["banned_user_username"] for item in items_admin} == {"flamer_pedro", "hacker_maria"}

        # 2. Filtro por nombre de usuario baneado (banned_user)
        res_by_user = client.post(
            "/moderation/banned-players",
            json={"banned_user": "hacker_"},
            headers=admin_auth_headers,
        )
        assert res_by_user.status_code == 200
        items_user = res_by_user.json()["list_banned_players"]
        assert len(items_user) == 2
        assert {item["banned_user_username"] for item in items_user} == {"hacker_luis", "hacker_maria"}

        # 3. Filtro por razón (reason)
        res_by_reason = client.post(
            "/moderation/banned-players",
            json={"reason": "Uso de cheats"},
            headers=admin_auth_headers,
        )
        assert res_by_reason.status_code == 200
        items_reason = res_by_reason.json()["list_banned_players"]
        assert len(items_reason) == 2
        assert {item["banned_user_username"] for item in items_reason} == {"hacker_luis", "hacker_maria"}

        # 4. Filtro por rango de fechas de creación (min_date_create / max_date_create)
        res_by_create = client.post(
            "/moderation/banned-players",
            json={
                "min_date_create": (base_time - timedelta(days=5)).isoformat(),
                "max_date_create": (base_time + timedelta(days=1)).isoformat(),
            },
            headers=admin_auth_headers,
        )
        assert res_by_create.status_code == 200
        items_create = res_by_create.json()["list_banned_players"]
        assert len(items_create) == 2
        assert {item["banned_user_username"] for item in items_create} == {"flamer_pedro", "hacker_maria"}

        # 5. Filtro cruzado combinando admin + usuario baneado + razón + fechas de creación y expiración
        res_crossed = client.post(
            "/moderation/banned-players",
            json={
                "banned_by": "mod_carlos",
                "banned_user": "hacker",
                "reason": "Uso de cheats",
                "min_date_create": (base_time - timedelta(days=1)).isoformat(),
                "max_date_create": (base_time + timedelta(days=1)).isoformat(),
                "min_date_expire": (base_time + timedelta(days=25)).isoformat(),
                "max_date_expire": (base_time + timedelta(days=35)).isoformat(),
            },
            headers=admin_auth_headers,
        )
        assert res_crossed.status_code == 200
        items_crossed = res_crossed.json()["list_banned_players"]
        assert len(items_crossed) == 1
        assert items_crossed[0]["banned_user_username"] == "hacker_maria"
        assert items_crossed[0]["banned_by_user_username"] == "mod_carlos"
        assert items_crossed[0]["reason"] == "Uso de cheats"
        assert items_crossed[0]["id"] == rec3.id
        assert items_crossed[0]["banned_user_id"] == banned_three.user_id
        assert items_crossed[0]["banned_by_user_id"] == admin_two.user_id

    def test_search_reported_players_with_filters(
        self, client, test_db_session, seed_player, seed_admin, player_auth_headers, admin_auth_headers, password_hasher
    ):
        target1 = _create_user(
            test_db_session, password_hasher, username="reported_alpha", mail="alpha@example.com"
        )
        target2 = _create_user(
            test_db_session, password_hasher, username="reported_beta", mail="beta@example.com"
        )

        client.post(
            "/moderation/",
            json={
                "reported_id": target1.user_id,
                "reason": "cheating",
                "description": "Cheats en partida",
            },
            headers=player_auth_headers,
        )
        client.post(
            "/moderation/",
            json={
                "reported_id": target2.user_id,
                "reason": "spamming",
                "description": "Spam en el chat",
            },
            headers=player_auth_headers,
        )

        # Baneamos a target1 para que su reporte pase a RESOLVED
        client.post(
            "/moderation/ban",
            json={"player_id": target1.user_id, "reason": "Confirmado", "duration_days": 5},
            headers=admin_auth_headers,
        )

        res_resolved = client.post(
            "/moderation/reported_players",
            json={
                "reported_by": seed_player.username,
                "reported_user": "reported_alpha",
                "status": "resolved",
                "reason": "cheating",
                "resolved_by": seed_admin.username,
            },
            headers=admin_auth_headers,
        )
        assert res_resolved.status_code == 200
        reports = res_resolved.json()["reports"]
        assert len(reports) == 1
        assert reports[0]["reported_user_name"] == "reported_alpha"
        assert reports[0]["status"] == "resolved"
        assert reports[0]["resolved_by"] == seed_admin.username

    def test_non_admin_cannot_access_admin_moderation_endpoints(
        self, client, seed_admin, player_auth_headers
    ):
        assert client.post(
            "/moderation/ban",
            json={"player_id": seed_admin.user_id, "reason": "Intento", "duration_days": 1},
            headers=player_auth_headers,
        ).status_code == 403
        assert client.post(
            f"/moderation/{seed_admin.user_id}/unban",
            headers=player_auth_headers,
        ).status_code == 403
        assert client.post(
            "/moderation/banned-players",
            json={},
            headers=player_auth_headers,
        ).status_code == 403
        assert client.post(
            "/moderation/reported_players",
            json={},
            headers=player_auth_headers,
        ).status_code == 403


class TestBannedUserSecurityAndExclusionsIntegration:
    """Tests de integración para el flujo de seguridad y exclusión de usuarios baneados (Tarea 1 y Tarea 3.3)."""

    def test_banned_user_rejected_on_login(
        self, client, test_db_session, seed_admin, admin_auth_headers, password_hasher
    ):
        banned_user = _create_user(
            test_db_session, password_hasher, username="bannedlogin", mail="bannedlogin@example.com"
        )
        client.post(
            "/moderation/ban",
            json={"player_id": banned_user.user_id, "reason": "Cheating", "duration_days": 10},
            headers=admin_auth_headers,
        )

        login_res = client.post(
            "/auth/v1/login",
            data={"username": banned_user.mail, "password": "Password123"},
        )
        assert login_res.status_code == 400
        assert "El baneo del jugador aún no ha finalizado" in login_res.json().get("error", "")

    def test_banned_user_with_expired_ban_is_automatically_unbanned_on_login(
        self, client, test_db_session, seed_admin, password_hasher
    ):
        expired_banned_user = _create_user(
            test_db_session,
            password_hasher,
            username="expiredban",
            mail="expiredban@example.com",
            banned=True,
        )
        expired_record = UserBanRecordORM(
            banned_user_id=expired_banned_user.user_id,
            banned_by_user_id=seed_admin.user_id,
            reason="Baneo temporal vencido",
            created_at=datetime.now() - timedelta(days=5),
            expires_at=datetime.now() - timedelta(days=1),
        )
        test_db_session.add(expired_record)
        test_db_session.commit()

        login_res = client.post(
            "/auth/v1/login",
            data={"username": expired_banned_user.mail, "password": "Password123"},
        )
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()

        test_db_session.expire_all()
        refreshed = (
            test_db_session.query(UserORM)
            .filter(UserORM.user_id == expired_banned_user.user_id)
            .first()
        )
        assert refreshed.banned is False

    def test_banned_user_rejected_on_refresh_token_and_protected_actions(
        self, client, test_db_session, seed_admin, admin_auth_headers, password_hasher
    ):
        user = _create_user(
            test_db_session, password_hasher, username="active_then_banned", mail="actban@example.com"
        )
        # Inicia sesión antes de ser baneado
        login_res = client.post(
            "/auth/v1/login",
            data={"username": user.mail, "password": "Password123"},
        )
        assert login_res.status_code == 200
        tokens = login_res.json()
        user_headers = {"Authorization": f"Bearer {tokens['access_token']}"}

        # El administrador lo banea
        ban_res = client.post(
            "/moderation/ban",
            json={"player_id": user.user_id, "reason": "Toxicidad", "duration_days": 7},
            headers=admin_auth_headers,
        )
        assert ban_res.status_code == 200

        # Intentar refrescar el token debe fallar con 400
        refresh_res = client.post("/auth/v1/refresh", json={"refresh_token": tokens["refresh_token"]})
        assert refresh_res.status_code == 400
        assert "El baneo del jugador aún no ha finalizado" in refresh_res.json().get("error", "")

        # Intentar realizar una acción protegida con el access_token previo debe ser bloqueado
        protected_res = client.get("/api/v1/users/me", headers=user_headers)
        assert protected_res.status_code == 400
        assert "El baneo del jugador aún no ha finalizado" in protected_res.json().get("error", "")

    def test_banned_user_excluded_from_public_profiles_game_profiles_teams_and_chat(
        self,
        client,
        test_db_session,
        seed_catalog_data,
        seed_player,
        seed_admin,
        player_auth_headers,
        admin_auth_headers,
        password_hasher,
    ):
        videogame = seed_catalog_data["videogame"]
        role = seed_catalog_data["roles"][0]
        rank = seed_catalog_data["ranks"][0]

        region = RegionORM(name="LAS", videogame_id=videogame.videogame_id)
        test_db_session.add(region)
        test_db_session.commit()
        test_db_session.refresh(region)

        banned_user = _create_user(
            test_db_session, password_hasher, username="ghostbanned", mail="ghost@example.com"
        )
        gp = GameProfileORM(
            player_id=banned_user.user_id,
            videogame_id=videogame.videogame_id,
            region_id=region.region_id,
            in_game_name="GhostBannedIGN",
        )
        test_db_session.add(gp)
        test_db_session.commit()
        test_db_session.refresh(gp)

        # Creamos un equipo liderado por el usuario que luego será baneado
        team_conv = ConversationORM(type=2, name="Chat del equipo Banned Leader Team")
        test_db_session.add(team_conv)
        test_db_session.flush()

        team = TeamORM(
            name="Banned Leader Team",
            description="Team of banned player",
            allow_other_regions=True,
            videogame_id=videogame.videogame_id,
            region_id=region.region_id,
            min_rank_id=rank.rank_id,
            max_rank_id=rank.rank_id,
            conversation_id=team_conv.conversation_id,
            is_active=True,
        )
        test_db_session.add(team)
        test_db_session.flush()
        leader_slot = TeamMemberRoleORM(
            team_id=team.team_id,
            user_id=banned_user.user_id,
            team_role_id=1,
            game_role_id=role.role_id,
        )
        test_db_session.add(leader_slot)
        test_db_session.commit()

        # Baneamos al usuario
        ban_res = client.post(
            "/moderation/ban",
            json={"player_id": banned_user.user_id, "reason": "Baneo general", "duration_days": 30},
            headers=admin_auth_headers,
        )
        assert ban_res.status_code == 200

        # 1. No debe aparecer en perfil público de usuario
        pub_profile_res = client.get(f"/api/v1/users/{banned_user.user_id}/profile", headers=player_auth_headers)
        assert pub_profile_res.status_code == 404

        # 2. No debe aparecer en el buscador de perfiles de juego
        search_gp_res = client.post(
            "/api/v1/game_profiles/search",
            json={"videogame_id": videogame.videogame_id, "name_player": "ghostbanned"},
            headers=player_auth_headers,
        )
        assert search_gp_res.status_code == 200
        assert search_gp_res.json()["videogame_profiles"] == []

        # 3. No debe aparecer su equipo en la búsqueda de equipos
        search_teams_res = client.get(
            f"/api/v1/teams?videogame_id={videogame.videogame_id}",
            headers=player_auth_headers,
        )
        assert search_teams_res.status_code == 200
        team_names = [t["name"] for t in search_teams_res.json()]
        assert "Banned Leader Team" not in team_names

        # 4. No se puede iniciar conversación privada con un usuario baneado
        chat_res = client.post(
            "/api/v1/chat",
            json={"target_user_id": banned_user.user_id},
            headers=player_auth_headers,
        )
        assert chat_res.status_code == 404
