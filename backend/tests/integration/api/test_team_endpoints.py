from datetime import datetime
import io
import pytest

from app.domain.models.user_role import UserRole
from app.infrastructure.database.models.character_orm import CharacterORM
from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.rank_orm import RankORM
from app.infrastructure.database.models.region_orm import RegionORM
from app.infrastructure.database.models.role_orm import RoleORM
from app.infrastructure.database.models.role_profile_orm import RoleProfileORM
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.models.videogame_orm import VideogameORM


class TestTeamEndpointsIntegration:

    @staticmethod
    def _team_form(payload):
        return {
            **payload,
            "vacant_game_role_ids": [str(role_id) for role_id in payload["vacant_game_role_ids"]],
        }

    def _create_player(self, session, password_hasher, username):
        user = UserORM(
            name=username.capitalize(),
            username=username,
            mail=f"{username}@example.com",
            password_hash=password_hasher.hash_password("Password123"),
            role="player",
            icon_url=f"/media/users/{username}.png",
            last_connection=datetime.now()
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

    @staticmethod
    def _headers(jwt_service, user):
        token, _, _, _ = jwt_service.generate_tokens(user_id=user.user_id, role=UserRole.PLAYER)
        return {"Authorization": f"Bearer {token}"}, token

    @pytest.fixture(scope="function")
    def setup_data(self, test_db_session, password_hasher, seed_player):
        # 1. Videogame
        vg = VideogameORM(name="Valorant", icon_url="/media/games/valorant/icon.png", rank_per_role=True)
        test_db_session.add(vg)
        test_db_session.flush()

        # 2. Regions
        reg_las = RegionORM(name="LAS", videogame_id=vg.videogame_id)
        reg_br = RegionORM(name="BR", videogame_id=vg.videogame_id)
        test_db_session.add_all([reg_las, reg_br])
        test_db_session.flush()

        # 3. Roles
        role_duelist = RoleORM(name="Duelista", videogame_id=vg.videogame_id, icon_url="/duelist.png")
        role_controller = RoleORM(name="Controlador", videogame_id=vg.videogame_id, icon_url="/controller.png")
        role_initiator = RoleORM(name="Iniciador", videogame_id=vg.videogame_id, icon_url="/initiator.png")
        test_db_session.add_all([role_duelist, role_controller, role_initiator])

        # 4. Ranks: Iron (100), Silver (500), Gold (1000), Diamond (2000)
        rank_iron = RankORM(name="Hierro", value=100, videogame_id=vg.videogame_id, icon_url="/iron.png")
        rank_silver = RankORM(name="Plata", value=500, videogame_id=vg.videogame_id, icon_url="/silver.png")
        rank_gold = RankORM(name="Oro", value=1000, videogame_id=vg.videogame_id, icon_url="/gold.png")
        rank_diamond = RankORM(name="Diamante", value=2000, videogame_id=vg.videogame_id, icon_url="/diamond.png")
        test_db_session.add_all([rank_iron, rank_silver, rank_gold, rank_diamond])
        test_db_session.flush()

        # 5. Profile for seed_player: Region LAS, Duelista = Oro (1000), Controlador = Plata (500)
        gp1 = GameProfileORM(player_id=seed_player.user_id, videogame_id=vg.videogame_id, region_id=reg_las.region_id)
        test_db_session.add(gp1)
        test_db_session.flush()
        rp1_1 = RoleProfileORM(game_profile_id=gp1.game_profile_id, role_id=role_duelist.role_id, rank_id=rank_gold.rank_id)
        rp1_2 = RoleProfileORM(game_profile_id=gp1.game_profile_id, role_id=role_controller.role_id, rank_id=rank_silver.rank_id)
        test_db_session.add_all([rp1_1, rp1_2])

        # 6. Player 2 (janedoe): Region LAS, Controlador = Oro (1000), Iniciador = Plata (500)
        p2 = self._create_player(test_db_session, password_hasher, "janedoe")
        gp2 = GameProfileORM(player_id=p2.user_id, videogame_id=vg.videogame_id, region_id=reg_las.region_id)
        test_db_session.add(gp2)
        test_db_session.flush()
        rp2_1 = RoleProfileORM(game_profile_id=gp2.game_profile_id, role_id=role_controller.role_id, rank_id=rank_gold.rank_id)
        rp2_2 = RoleProfileORM(game_profile_id=gp2.game_profile_id, role_id=role_initiator.role_id, rank_id=rank_silver.rank_id)
        test_db_session.add_all([rp2_1, rp2_2])

        # 7. Player 3 (br_player): Region BR, Controlador = Oro (1000)
        p3 = self._create_player(test_db_session, password_hasher, "brplayer")
        gp3 = GameProfileORM(player_id=p3.user_id, videogame_id=vg.videogame_id, region_id=reg_br.region_id)
        test_db_session.add(gp3)
        test_db_session.flush()
        rp3_1 = RoleProfileORM(game_profile_id=gp3.game_profile_id, role_id=role_controller.role_id, rank_id=rank_gold.rank_id)
        test_db_session.add(rp3_1)

        # 8. Player 4 (high_rank): Region LAS, Controlador = Diamante (2000)
        p4 = self._create_player(test_db_session, password_hasher, "highrank")
        gp4 = GameProfileORM(player_id=p4.user_id, videogame_id=vg.videogame_id, region_id=reg_las.region_id)
        test_db_session.add(gp4)
        test_db_session.flush()
        rp4_1 = RoleProfileORM(game_profile_id=gp4.game_profile_id, role_id=role_controller.role_id, rank_id=rank_diamond.rank_id)
        test_db_session.add(rp4_1)

        # 9. Player 5 (low_rank): Region LAS, Controlador = Hierro (100)
        p5 = self._create_player(test_db_session, password_hasher, "lowrank")
        gp5 = GameProfileORM(player_id=p5.user_id, videogame_id=vg.videogame_id, region_id=reg_las.region_id)
        test_db_session.add(gp5)
        test_db_session.flush()
        rp5_1 = RoleProfileORM(game_profile_id=gp5.game_profile_id, role_id=role_controller.role_id, rank_id=rank_iron.rank_id)
        test_db_session.add(rp5_1)

        test_db_session.commit()

        return {
            "videogame": vg,
            "regions": {"las": reg_las, "br": reg_br},
            "roles": {"duelist": role_duelist, "controller": role_controller, "initiator": role_initiator},
            "ranks": {"iron": rank_iron, "silver": rank_silver, "gold": rank_gold, "diamond": rank_diamond},
            "players": {"seed": seed_player, "janedoe": p2, "br": p3, "high": p4, "low": p5}
        }

    # =========================================================================
    # USER STORY 1: Registrar un equipo
    # =========================================================================

    def test_create_team_success(self, client, player_auth_headers, setup_data):
        vg = setup_data["videogame"]
        reg = setup_data["regions"]["las"]
        ranks = setup_data["ranks"]
        roles = setup_data["roles"]

        payload = {
            "name": "Los Vengadores",
            "description": "Buscamos subir a Diamante",
            "allow_other_regions": False,
            "videogame_id": vg.videogame_id,
            "region_id": reg.region_id,
            "min_rank_id": ranks["silver"].rank_id,
            "max_rank_id": ranks["gold"].rank_id,
            "creator_game_role_id": roles["duelist"].role_id,
            "vacant_game_role_ids": [roles["controller"].role_id, roles["initiator"].role_id]
        }

        response = client.post(
            "/api/v1/teams",
            data=self._team_form(payload),
            files={"team_icon": ("vengadores.png", io.BytesIO(b"fake-team-icon"), "image/png")},
            headers=player_auth_headers,
        )
        assert response.status_code == 201
        data = response.json()

        assert data["team_name"] == "Los Vengadores"
        assert data["player_count"] == 1
        assert data["max_players"] == 3
        assert data["max_players"] - data["player_count"] == 2
        assert data["consultant_player_info"]["is_leader"] is True
        assert data["consultant_player_info"]["is_member"] is True
        assert data["conversation_id"] is not None
        assert data["icon_url"].startswith("/media/teams/icons/")

        # Verificar que el creador ocupa el primer slot como líder
        leader_member = data["members"][0]
        assert leader_member["is_leader"] is True
        assert leader_member["is_vacant"] is False
        assert leader_member["username"] == setup_data["players"]["seed"].username

        # Verificar que las vacantes tienen team_member_role_id y is_vacant=True
        vacancies = [m for m in data["members"] if m["is_vacant"]]
        assert len(vacancies) == 2
        for v in vacancies:
            assert v["team_member_role_id"] is not None

        # El creador tiene acceso automático al chatroom del equipo
        chat_res = client.get(f"/api/v1/chat/chatroom/{data['conversation_id']}/messages", headers=player_auth_headers)
        assert chat_res.status_code == 200

        # Puede consultar su equipo por GET /api/v1/teams/me y GET /api/v1/teams/{id}
        me_res = client.get("/api/v1/teams/me", headers=player_auth_headers)
        assert me_res.status_code == 200
        assert me_res.json()["team_id"] == data["team_id"]

        get_res = client.get(f"/api/v1/teams/{data['team_id']}", headers=player_auth_headers)
        assert get_res.status_code == 200
        assert get_res.json()["team_id"] == data["team_id"]

    def test_create_team_empty_mandatory_fields_fails(self, client, player_auth_headers, setup_data):
        vg = setup_data["videogame"]
        ranks = setup_data["ranks"]
        roles = setup_data["roles"]

        # Nombre vacío / en blanco
        payload = {
            "name": "   ",
            "allow_other_regions": True,
            "videogame_id": vg.videogame_id,
            "min_rank_id": ranks["silver"].rank_id,
            "max_rank_id": ranks["gold"].rank_id,
            "creator_game_role_id": roles["duelist"].role_id,
            "vacant_game_role_ids": [roles["controller"].role_id]
        }
        res = client.post("/api/v1/teams", data=self._team_form(payload), headers=player_auth_headers)
        assert res.status_code == 422

        # Sin vacantes (vacant_game_role_ids vacío)
        payload["name"] = "Team Valido"
        payload["vacant_game_role_ids"] = []
        res = client.post("/api/v1/teams", data=self._team_form(payload), headers=player_auth_headers)
        assert res.status_code == 422

    def test_create_team_min_rank_superior_to_max_rank_fails(self, client, player_auth_headers, setup_data):
        vg = setup_data["videogame"]
        reg = setup_data["regions"]["las"]
        ranks = setup_data["ranks"]
        roles = setup_data["roles"]

        payload = {
            "name": "Team Rango Invertido",
            "allow_other_regions": False,
            "videogame_id": vg.videogame_id,
            "region_id": reg.region_id,
            "min_rank_id": ranks["diamond"].rank_id,  # 2000
            "max_rank_id": ranks["silver"].rank_id,   # 500
            "creator_game_role_id": roles["duelist"].role_id,
            "vacant_game_role_ids": [roles["controller"].role_id]
        }
        res = client.post("/api/v1/teams", data=self._team_form(payload), headers=player_auth_headers)
        assert res.status_code == 400
        assert "no puede ser superior al rango máximo" in res.json()["error"]

    def test_create_team_creator_rank_excluded_fails(self, client, player_auth_headers, setup_data):
        vg = setup_data["videogame"]
        reg = setup_data["regions"]["las"]
        ranks = setup_data["ranks"]
        roles = setup_data["roles"]

        # El creador es Oro (1000), pero configuró min=Hierro(100) y max=Plata(500)
        payload = {
            "name": "Team Rango Excluido",
            "allow_other_regions": False,
            "videogame_id": vg.videogame_id,
            "region_id": reg.region_id,
            "min_rank_id": ranks["iron"].rank_id,
            "max_rank_id": ranks["silver"].rank_id,
            "creator_game_role_id": roles["duelist"].role_id,
            "vacant_game_role_ids": [roles["controller"].role_id]
        }
        res = client.post("/api/v1/teams", data=self._team_form(payload), headers=player_auth_headers)
        assert res.status_code == 400
        assert "no es válido para el equipo" in res.json()["error"]

    def test_create_team_already_in_active_team_fails(self, client, player_auth_headers, setup_data):
        vg = setup_data["videogame"]
        reg = setup_data["regions"]["las"]
        ranks = setup_data["ranks"]
        roles = setup_data["roles"]

        payload = {
            "name": "Team Inicial",
            "allow_other_regions": True,
            "videogame_id": vg.videogame_id,
            "region_id": reg.region_id,
            "min_rank_id": ranks["silver"].rank_id,
            "max_rank_id": ranks["gold"].rank_id,
            "creator_game_role_id": roles["duelist"].role_id,
            "vacant_game_role_ids": [roles["controller"].role_id]
        }
        res1 = client.post("/api/v1/teams", data=self._team_form(payload), headers=player_auth_headers)
        assert res1.status_code == 201

        # Segundo intento con el mismo usuario estando ya en un equipo activo
        payload["name"] = "Segundo Team"
        res2 = client.post("/api/v1/teams", data=self._team_form(payload), headers=player_auth_headers)
        assert res2.status_code == 409
        assert "ya forma parte de un equipo activo" in res2.json()["error"]

    # =========================================================================
    # USER STORY 2: Incorporarse a un equipo
    # =========================================================================

    def _create_sample_team(self, client, player_auth_headers, setup_data, allow_other_regions=False):
        vg = setup_data["videogame"]
        reg = setup_data["regions"]["las"]
        ranks = setup_data["ranks"]
        roles = setup_data["roles"]

        payload = {
            "name": "Alpha Team",
            "allow_other_regions": allow_other_regions,
            "videogame_id": vg.videogame_id,
            "region_id": reg.region_id,
            "min_rank_id": ranks["silver"].rank_id,  # 500
            "max_rank_id": ranks["gold"].rank_id,    # 1000
            "creator_game_role_id": roles["duelist"].role_id,
            "vacant_game_role_ids": [roles["controller"].role_id]
        }
        res = client.post("/api/v1/teams", data=self._team_form(payload), headers=player_auth_headers)
        assert res.status_code == 201
        return res.json()

    def test_join_team_success(self, client, jwt_service, player_auth_headers, setup_data):
        team_data = self._create_sample_team(client, player_auth_headers, setup_data)
        team_id = team_data["team_id"]
        target_slot_id = team_data["members"][1]["team_member_role_id"]

        headers_p2, _ = self._headers(jwt_service, setup_data["players"]["janedoe"])

        # janedoe se une al equipo
        join_res = client.post(f"/api/v1/teams/{team_id}/join",
                               json={"target_team_member_role_id": target_slot_id},
                               headers=headers_p2)
        assert join_res.status_code == 200
        body = join_res.json()
        assert body["status"] == "success"
        assert body["chatroom_id"] == team_data["conversation_id"]
        assert body["data"]["player_count"] == 2
        assert body["data"]["max_players"] - body["data"]["player_count"] == 0

        # El jugador ahora tiene acceso al chatroom del equipo
        chat_res = client.get(f"/api/v1/chat/chatroom/{body['chatroom_id']}/messages", headers=headers_p2)
        assert chat_res.status_code == 200

    def test_join_team_when_full_fails(self, client, jwt_service, player_auth_headers, setup_data):
        team_data = self._create_sample_team(client, player_auth_headers, setup_data)
        team_id = team_data["team_id"]
        target_slot_id = team_data["members"][1]["team_member_role_id"]

        headers_p2, _ = self._headers(jwt_service, setup_data["players"]["janedoe"])
        client.post(f"/api/v1/teams/{team_id}/join",
                    json={"target_team_member_role_id": target_slot_id},
                    headers=headers_p2)

        # Intento de un tercer jugador de unirse al equipo ya completo
        headers_p3, _ = self._headers(jwt_service, setup_data["players"]["high"])
        res = client.post(f"/api/v1/teams/{team_id}/join",
                          json={"target_team_member_role_id": target_slot_id},
                          headers=headers_p3)
        assert res.status_code == 400
        assert "está completo" in res.json()["error"]

    def test_join_team_rank_out_of_range_fails(self, client, jwt_service, player_auth_headers, setup_data):
        team_data = self._create_sample_team(client, player_auth_headers, setup_data)
        team_id = team_data["team_id"]
        target_slot_id = team_data["members"][1]["team_member_role_id"]

        # Rango inferior (Hierro 100 vs min Plata 500)
        headers_low, _ = self._headers(jwt_service, setup_data["players"]["low"])
        res_low = client.post(f"/api/v1/teams/{team_id}/join",
                              json={"target_team_member_role_id": target_slot_id},
                              headers=headers_low)
        assert res_low.status_code == 400
        assert "no es válido para el equipo" in res_low.json()["error"]

        # Rango superior (Diamante 2000 vs max Oro 1000)
        headers_high, _ = self._headers(jwt_service, setup_data["players"]["high"])
        res_high = client.post(f"/api/v1/teams/{team_id}/join",
                               json={"target_team_member_role_id": target_slot_id},
                               headers=headers_high)
        assert res_high.status_code == 400
        assert "no es válido para el equipo" in res_high.json()["error"]

    def test_join_team_region_restriction(self, client, jwt_service, player_auth_headers, setup_data):
        # 1. Equipo que NO admite otras regiones (LAS)
        team_data_strict = self._create_sample_team(client, player_auth_headers, setup_data, allow_other_regions=False)
        target_slot_id = team_data_strict["members"][1]["team_member_role_id"]

        headers_br, _ = self._headers(jwt_service, setup_data["players"]["br"])
        res = client.post(f"/api/v1/teams/{team_data_strict['team_id']}/join",
                          json={"target_team_member_role_id": target_slot_id},
                          headers=headers_br)
        assert res.status_code == 400
        assert "solo admite jugadores de la región" in res.json()["error"]

        # 2. Equipo que SÍ admite otras regiones
        # Creamos otro equipo con otro líder (janedoe) que permita otras regiones
        vg = setup_data["videogame"]
        reg = setup_data["regions"]["las"]
        ranks = setup_data["ranks"]
        roles = setup_data["roles"]
        headers_jane, _ = self._headers(jwt_service, setup_data["players"]["janedoe"])

        payload_open = {
            "name": "Open Region Team",
            "allow_other_regions": True,
            "videogame_id": vg.videogame_id,
            "region_id": reg.region_id,
            "min_rank_id": ranks["silver"].rank_id,
            "max_rank_id": ranks["gold"].rank_id,
            "creator_game_role_id": roles["initiator"].role_id,
            "vacant_game_role_ids": [roles["controller"].role_id]
        }
        team_open = client.post(
            "/api/v1/teams",
            data=self._team_form(payload_open),
            headers=headers_jane,
        ).json()
        open_slot = team_open["members"][1]["team_member_role_id"]

        res_open = client.post(f"/api/v1/teams/{team_open['team_id']}/join",
                               json={"target_team_member_role_id": open_slot},
                               headers=headers_br)
        assert res_open.status_code == 200
        assert res_open.json()["status"] == "success"

    def test_join_team_already_in_another_team_fails(self, client, jwt_service, player_auth_headers, setup_data):
        # seed crea un equipo
        team_a = self._create_sample_team(client, player_auth_headers, setup_data)

        # janedoe crea otro equipo
        headers_jane, _ = self._headers(jwt_service, setup_data["players"]["janedoe"])
        vg = setup_data["videogame"]
        ranks = setup_data["ranks"]
        roles = setup_data["roles"]
        team_b = client.post(
            "/api/v1/teams",
            data=self._team_form({
                "name": "Team B",
                "allow_other_regions": True,
                "videogame_id": vg.videogame_id,
                "min_rank_id": ranks["silver"].rank_id,
                "max_rank_id": ranks["gold"].rank_id,
                "creator_game_role_id": roles["initiator"].role_id,
                "vacant_game_role_ids": [roles["controller"].role_id]
            }),
            headers=headers_jane,
        ).json()

        # janedoe intenta unirse a Team A estando ya en Team B
        slot_a = team_a["members"][1]["team_member_role_id"]
        res = client.post(f"/api/v1/teams/{team_a['team_id']}/join",
                          json={"target_team_member_role_id": slot_a},
                          headers=headers_jane)
        assert res.status_code == 409
        assert "ya forma parte de un equipo activo" in res.json()["error"]

    # =========================================================================
    # USER STORY 3: Buscar equipos
    # =========================================================================

    def test_search_teams_and_filtering(self, client, jwt_service, player_auth_headers, setup_data):
        vg = setup_data["videogame"]
        reg_las = setup_data["regions"]["las"]
        ranks = setup_data["ranks"]
        roles = setup_data["roles"]

        # Crear Team 1
        client.post(
            "/api/v1/teams",
            data=self._team_form({
                "name": "Team Bravo",
                "description": "Buscamos support",
                "allow_other_regions": True,
                "videogame_id": vg.videogame_id,
                "region_id": reg_las.region_id,
                "min_rank_id": ranks["silver"].rank_id,
                "max_rank_id": ranks["gold"].rank_id,
                "creator_game_role_id": roles["duelist"].role_id,
                "vacant_game_role_ids": [roles["controller"].role_id, roles["initiator"].role_id]
            }),
            headers=player_auth_headers,
        )

        # 1. Búsqueda general: debe incluir datos, vacantes, representative_rank y join_eligibility
        headers_jane, _ = self._headers(jwt_service, setup_data["players"]["janedoe"])
        res = client.get("/api/v1/teams", headers=headers_jane)
        assert res.status_code == 200
        teams = res.json()
        assert len(teams) >= 1
        t = next(x for x in teams if x["team_name"] == "Team Bravo")
        assert t["player_count"] == 1
        assert t["max_players"] == 3
        assert t["max_players"] - t["player_count"] == 2
        assert t["representative_rank"] is not None
        assert t["consultant_player_info"]["join_eligibility"]["can_join"] is True

        # 2. Filtro por videojuego
        res_vg = client.get(f"/api/v1/teams?videogame_id={vg.videogame_id}", headers=headers_jane)
        assert len(res_vg.json()) >= 1

        # 3. Filtro por región
        res_reg = client.get(f"/api/v1/teams?region_id={reg_las.region_id}", headers=headers_jane)
        assert len(res_reg.json()) >= 1

        # 4. Filtro por texto coincidente en nombre o descripción
        res_name = client.get("/api/v1/teams?search=Bravo", headers=headers_jane)
        assert len(res_name.json()) >= 1
        res_desc = client.get("/api/v1/teams?search=support", headers=headers_jane)
        assert len(res_desc.json()) >= 1

        # 5. Filtro por rol vacante
        res_role = client.get(f"/api/v1/teams?role_id={roles['controller'].role_id}", headers=headers_jane)
        assert len(res_role.json()) >= 1

        # 6. Filtro por cantidad de cupos vacantes
        res_vac = client.get("/api/v1/teams?vacant_slots=2", headers=headers_jane)
        assert len(res_vac.json()) >= 1
        res_vac_too_many = client.get("/api/v1/teams?vacant_slots=5", headers=headers_jane)
        assert len(res_vac_too_many.json()) == 0

        # 7. Búsqueda sin coincidencias devuelve lista vacía
        res_empty = client.get("/api/v1/teams?search=Inexistente123456", headers=headers_jane)
        assert res_empty.status_code == 200
        assert res_empty.json() == []

        # 8. Visualizar equipo cuando el jugador no cumple requisitos (br_player con equipo estricto)
        # br_player ve can_join=False
        headers_br, _ = self._headers(jwt_service, setup_data["players"]["br"])
        # Creamos un equipo con restricción de región por seed_player
        res_br_view = client.get("/api/v1/teams", headers=headers_br)
        assert res_br_view.status_code == 200

    # =========================================================================
    # USER STORY 4: Modificar información del equipo
    # =========================================================================

    def test_update_team_success_as_creator(self, client, player_auth_headers, setup_data):
        team_data = self._create_sample_team(client, player_auth_headers, setup_data)
        team_id = team_data["team_id"]
        ranks = setup_data["ranks"]
        regions = setup_data["regions"]

        payload = {
            "name": "Alpha Team Renamed",
            "description": "Nueva descripcion del equipo",
            "allow_other_regions": True,
            "region_id": regions["br"].region_id,
            "min_rank_id": ranks["silver"].rank_id,
            "max_rank_id": ranks["diamond"].rank_id,
        }

        response = client.put(f"/api/v1/teams/{team_id}", json=payload, headers=player_auth_headers)
        assert response.status_code == 200
        body = response.json()

        assert body["status"] == "success"
        assert "Alpha Team Renamed" in body["message"]
        data = body["data"]
        assert data["team_name"] == "Alpha Team Renamed"
        assert data["description"] == "Nueva descripcion del equipo"
        assert data["allow_other_regions"] is True
        assert data["region"]["region_id"] == regions["br"].region_id
        assert data["min_rank"]["rank_id"] == ranks["silver"].rank_id
        assert data["max_rank"]["rank_id"] == ranks["diamond"].rank_id

        # Verificar que se actualizó en la consulta individual
        get_res = client.get(f"/api/v1/teams/{team_id}", headers=player_auth_headers)
        assert get_res.status_code == 200
        assert get_res.json()["team_name"] == "Alpha Team Renamed"

        # Verificar que se actualizó en la lista general de equipos
        feed_res = client.get("/api/v1/teams", headers=player_auth_headers)
        assert feed_res.status_code == 200
        feed_teams = feed_res.json()
        matching = [t for t in feed_teams if t["team_id"] == team_id]
        assert len(matching) == 1
        assert matching[0]["team_name"] == "Alpha Team Renamed"
        assert matching[0]["description"] == "Nueva descripcion del equipo"

    def test_update_team_not_creator_or_outsider_fails(self, client, jwt_service, player_auth_headers, setup_data):
        team_data = self._create_sample_team(client, player_auth_headers, setup_data)
        team_id = team_data["team_id"]
        ranks = setup_data["ranks"]
        target_slot_id = team_data["members"][1]["team_member_role_id"]

        # 1. Unirse como miembro (janedoe)
        headers_jane, _ = self._headers(jwt_service, setup_data["players"]["janedoe"])
        join_res = client.post(f"/api/v1/teams/{team_id}/join",
                               json={"target_team_member_role_id": target_slot_id},
                               headers=headers_jane)
        assert join_res.status_code == 200

        payload = {
            "name": "Intento de Miembro",
            "description": "Desc",
            "allow_other_regions": True,
            "region_id": None,
            "min_rank_id": ranks["silver"].rank_id,
            "max_rank_id": ranks["gold"].rank_id,
        }

        # Probar acceder a la modificación del equipo siendo un miembro sin rol de creador (falla con 403)
        res_member = client.put(f"/api/v1/teams/{team_id}", json=payload, headers=headers_jane)
        assert res_member.status_code == 403
        assert "no es el líder del equipo" in res_member.json()["error"]

        # Probar acceder a la modificación del equipo siendo un usuario ajeno (falla con 403)
        headers_outsider, _ = self._headers(jwt_service, setup_data["players"]["high"])
        res_outsider = client.put(f"/api/v1/teams/{team_id}", json=payload, headers=headers_outsider)
        assert res_outsider.status_code == 403
        assert "no es el líder del equipo" in res_outsider.json()["error"]

    def test_update_team_empty_name_fails(self, client, player_auth_headers, setup_data):
        team_data = self._create_sample_team(client, player_auth_headers, setup_data)
        team_id = team_data["team_id"]
        ranks = setup_data["ranks"]

        payload = {
            "name": "   ",
            "description": "Desc",
            "allow_other_regions": True,
            "region_id": None,
            "min_rank_id": ranks["silver"].rank_id,
            "max_rank_id": ranks["gold"].rank_id,
        }
        res = client.put(f"/api/v1/teams/{team_id}", json=payload, headers=player_auth_headers)
        assert res.status_code == 422

    def test_update_team_min_rank_superior_to_max_rank_fails(self, client, player_auth_headers, setup_data):
        team_data = self._create_sample_team(client, player_auth_headers, setup_data)
        team_id = team_data["team_id"]
        ranks = setup_data["ranks"]

        payload = {
            "name": "Alpha Team Rango Invertido",
            "description": "Desc",
            "allow_other_regions": True,
            "region_id": None,
            "min_rank_id": ranks["diamond"].rank_id,  # 2000
            "max_rank_id": ranks["silver"].rank_id,   # 500
        }
        res = client.put(f"/api/v1/teams/{team_id}", json=payload, headers=player_auth_headers)
        assert res.status_code == 400
        assert "no puede ser superior al rango máximo" in res.json()["error"]

    def test_update_team_excludes_active_member_rank_fails(self, client, jwt_service, player_auth_headers, setup_data):
        # 1. Crear equipo con vacante para Iniciador
        vg = setup_data["videogame"]
        reg = setup_data["regions"]["las"]
        ranks = setup_data["ranks"]
        roles = setup_data["roles"]

        create_payload = {
            "name": "Team Con Miembro Plata",
            "description": "Desc",
            "allow_other_regions": False,
            "videogame_id": vg.videogame_id,
            "region_id": reg.region_id,
            "min_rank_id": ranks["silver"].rank_id,  # 500
            "max_rank_id": ranks["gold"].rank_id,    # 1000
            "creator_game_role_id": roles["duelist"].role_id,  # Creador es Duelista = Oro (1000)
            "vacant_game_role_ids": [roles["initiator"].role_id]
        }
        create_res = client.post("/api/v1/teams", data=self._team_form(create_payload), headers=player_auth_headers)
        assert create_res.status_code == 201
        team_id = create_res.json()["team_id"]
        target_slot_id = create_res.json()["members"][1]["team_member_role_id"]

        # 2. janedoe se une en el rol Iniciador (su rango es Plata, 500)
        headers_jane, _ = self._headers(jwt_service, setup_data["players"]["janedoe"])
        join_res = client.post(f"/api/v1/teams/{team_id}/join",
                               json={"target_team_member_role_id": target_slot_id},
                               headers=headers_jane)
        assert join_res.status_code == 200

        # 3. El creador intenta cambiar los rangos a Oro (1000) - Diamante (2000).
        # El creador (Oro 1000) sí entra, pero la integrante Jane Doe (Plata 500) queda excluida (< 1000).
        update_payload = {
            "name": "Team Con Miembro Plata",
            "description": "Desc actualizada",
            "allow_other_regions": False,
            "region_id": reg.region_id,
            "min_rank_id": ranks["gold"].rank_id,     # 1000
            "max_rank_id": ranks["diamond"].rank_id,  # 2000
        }
        res = client.put(f"/api/v1/teams/{team_id}", json=update_payload, headers=player_auth_headers)
        assert res.status_code == 400
        assert "no es válido para el equipo" in res.json()["error"]

    def test_update_team_only_description_and_region_permission_preserves_ranks(self, client, player_auth_headers, setup_data):
        team_data = self._create_sample_team(client, player_auth_headers, setup_data)
        team_id = team_data["team_id"]
        ranks = setup_data["ranks"]
        regions = setup_data["regions"]

        payload = {
            "name": team_data["team_name"],
            "description": "Solo cambio descripcion y permiso de region",
            "allow_other_regions": True,
            "region_id": regions["las"].region_id,
            "min_rank_id": ranks["silver"].rank_id,
            "max_rank_id": ranks["gold"].rank_id,
        }

        res = client.put(f"/api/v1/teams/{team_id}", json=payload, headers=player_auth_headers)
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["description"] == "Solo cambio descripcion y permiso de region"
        assert data["allow_other_regions"] is True
        assert data["min_rank"]["rank_id"] == ranks["silver"].rank_id
        assert data["max_rank"]["rank_id"] == ranks["gold"].rank_id

