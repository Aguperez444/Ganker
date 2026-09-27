from datetime import datetime, timedelta
import pytest
from app.domain.models.user_role import UserRole
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.models.videogame_orm import VideogameORM
from app.infrastructure.database.models.character_orm import CharacterORM
from app.infrastructure.database.models.role_orm import RoleORM
from app.infrastructure.database.models.rank_orm import RankORM
from app.infrastructure.database.models.game_profile_orm import GameProfileORM
from app.infrastructure.database.models.character_priority_orm import CharacterPriorityORM
from app.infrastructure.database.models.role_profile_orm import RoleProfileORM


class TestGameProfileEndpointsIntegration:

    @pytest.fixture
    def overwatch_data(self, test_db_session):
        ow = VideogameORM(name="Overwatch", icon_url="/media/games/ow.png", rank_per_role=True)
        test_db_session.add(ow)
        test_db_session.flush()

        bastion = CharacterORM(name="Bastion", videogame_id=ow.videogame_id, icon_url="/bastion.png")
        reaper = CharacterORM(name="Reaper", videogame_id=ow.videogame_id, icon_url="/reaper.png")
        reinhardt = CharacterORM(name="Reinhardt", videogame_id=ow.videogame_id, icon_url="/reinhardt.png")
        kiriko = CharacterORM(name="Kiriko", videogame_id=ow.videogame_id, icon_url="/kiriko.png")
        test_db_session.add_all([bastion, reaper, reinhardt, kiriko])

        dano = RoleORM(name="Daño", videogame_id=ow.videogame_id, icon_url="/dano.png")
        tanque = RoleORM(name="Tanque", videogame_id=ow.videogame_id, icon_url="/tanque.png")
        support = RoleORM(name="Support", videogame_id=ow.videogame_id, icon_url="/support.png")
        test_db_session.add_all([dano, tanque, support])

        oro = RankORM(name="Oro", value=1000, videogame_id=ow.videogame_id, icon_url="/oro.png")
        platino = RankORM(name="Platino", value=2000, videogame_id=ow.videogame_id, icon_url="/platino.png")
        test_db_session.add_all([oro, platino])

        test_db_session.commit()
        return {
            "videogame": ow,
            "characters": {"bastion": bastion, "reaper": reaper, "reinhardt": reinhardt, "kiriko": kiriko},
            "roles": {"dano": dano, "tanque": tanque, "support": support},
            "ranks": {"oro": oro, "platino": platino},
        }

    # ---------------------------------------------------------
    # POST /api/v1/game_profiles/
    # ---------------------------------------------------------

    def test_create_game_profile_success(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        char_id = seed_catalog_data["characters"][0].character_id
        role_id = seed_catalog_data["roles"][0].role_id
        rank_id = seed_catalog_data["ranks"][0].rank_id

        payload = {
            "videogame_id": vg_id,
            "character_ids": [char_id],
            "roles": [{"role_id": role_id, "rank_id": rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)

        assert response.status_code == 201
        data = response.json()
        assert "profile_id" in data
        assert isinstance(data["profile_id"], int)

    def test_create_profile_overwatch_multi_characters_and_roles(self, client, player_auth_headers, overwatch_data):
        # Probar crear un perfil seleccionando Overwatch, registrando Bastion, Reaper y Reinhardt como personajes utilizados,
        # y seleccionando rango Platino para el rol Daño y Oro para el rol Tanque (pasa)
        ow = overwatch_data["videogame"]
        chars = overwatch_data["characters"]
        roles = overwatch_data["roles"]
        ranks = overwatch_data["ranks"]

        payload = {
            "videogame_id": ow.videogame_id,
            "character_ids": [chars["bastion"].character_id, chars["reaper"].character_id, chars["reinhardt"].character_id],
            "roles": [
                {"role_id": roles["dano"].role_id, "rank_id": ranks["platino"].rank_id},
                {"role_id": roles["tanque"].role_id, "rank_id": ranks["oro"].rank_id},
            ]
        }
        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 201
        assert "profile_id" in response.json()

    def test_create_profile_overwatch_single_role_support(self, client, player_auth_headers, overwatch_data):
        # Probar crear un perfil seleccionando Overwatch y registrando main kiriko, únicamente el rol support con su rango (pasa)
        ow = overwatch_data["videogame"]
        chars = overwatch_data["characters"]
        roles = overwatch_data["roles"]
        ranks = overwatch_data["ranks"]

        payload = {
            "videogame_id": ow.videogame_id,
            "character_ids": [chars["kiriko"].character_id],
            "roles": [
                {"role_id": roles["support"].role_id, "rank_id": ranks["oro"].rank_id}
            ]
        }
        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 201
        assert "profile_id" in response.json()

    def test_create_profile_lol_shared_rank_per_profile(self, client, player_auth_headers, seed_catalog_data, test_db_session):
        # Probar crear un perfil seleccionando League Of Legends, registrando Swain y Seth como personajes "main",
        # seleccionando el rango "esmeralda" para el perfil, y seleccionando los roles top y medio y se registra el rango esmeralda en ambos (pasa)
        from app.infrastructure.database.models.character_orm import CharacterORM
        from app.infrastructure.database.models.rank_orm import RankORM

        vg = seed_catalog_data["videogame"]
        swain = CharacterORM(name="Swain", videogame_id=vg.videogame_id, icon_url="/swain.png")
        sett = CharacterORM(name="Sett", videogame_id=vg.videogame_id, icon_url="/sett.png")
        esmeralda = RankORM(name="Esmeralda", value=2500, videogame_id=vg.videogame_id, icon_url="/esmeralda.png")
        test_db_session.add_all([swain, sett, esmeralda])
        test_db_session.commit()

        top_role = next(r for r in seed_catalog_data["roles"] if r.name == "Top")
        mid_role = next(r for r in seed_catalog_data["roles"] if r.name == "Mid")

        payload = {
            "videogame_id": vg.videogame_id,
            "character_ids": [swain.character_id, sett.character_id],
            "roles": [
                {"role_id": top_role.role_id, "rank_id": esmeralda.rank_id},
                {"role_id": mid_role.role_id, "rank_id": esmeralda.rank_id},
            ]
        }
        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 201
        assert "profile_id" in response.json()

    def test_create_profile_different_videogame_after_existing(self, client, player_auth_headers, overwatch_data, test_db_session):
        # Probar crear un perfil para un videojuego diferente al que ya tiene registrado el jugador,
        # (por ejemplo Valorant luego de haber creado un perfil de Overwatch) indicando rango y rol donde corresponda (pasa)
        ow = overwatch_data["videogame"]
        ow_res = client.post("/api/v1/game_profiles/", json={
            "videogame_id": ow.videogame_id,
            "character_ids": [overwatch_data["characters"]["kiriko"].character_id],
            "roles": [{"role_id": overwatch_data["roles"]["support"].role_id, "rank_id": overwatch_data["ranks"]["oro"].rank_id}]
        }, headers=player_auth_headers)
        assert ow_res.status_code == 201

        val = VideogameORM(name="Valorant", icon_url="/val.png", rank_per_role=False)
        test_db_session.add(val)
        test_db_session.flush()
        jett = CharacterORM(name="Jett", videogame_id=val.videogame_id, icon_url="/jett.png")
        duelist = RoleORM(name="Duelist", videogame_id=val.videogame_id, icon_url="/duelist.png")
        gold_val = RankORM(name="Gold Val", value=1000, videogame_id=val.videogame_id, icon_url="/gold.png")
        test_db_session.add_all([jett, duelist, gold_val])
        test_db_session.commit()

        val_res = client.post("/api/v1/game_profiles/", json={
            "videogame_id": val.videogame_id,
            "character_ids": [jett.character_id],
            "roles": [{"role_id": duelist.role_id, "rank_id": gold_val.rank_id}]
        }, headers=player_auth_headers)
        assert val_res.status_code == 201

    def test_create_profile_without_videogame_fails(self, client, player_auth_headers, seed_catalog_data):
        # Probar crear un perfil sin seleccionar un videojuego (falla)
        payload = {
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }
        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 422

    def test_create_profile_rank_not_available_for_game_fails(self, client, player_auth_headers, seed_catalog_data, test_db_session):
        # Probar crear un perfil seleccionando un rango que no se encuentre entre los rangos disponibles para el rol seleccionado (falla)
        other_game = VideogameORM(name="Other Game", icon_url="/other.png", rank_per_role=False)
        test_db_session.add(other_game)
        test_db_session.flush()
        other_rank = RankORM(name="Alien Rank", value=500, videogame_id=other_game.videogame_id, icon_url="/alien.png")
        test_db_session.add(other_rank)
        test_db_session.commit()

        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": other_rank.rank_id}]
        }
        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 400
        assert "no pertenece" in response.json().get("error", "").lower()

    def test_create_game_profile_unauthorized_without_token(self, client, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload)
        assert response.status_code == 401

    def test_create_game_profile_unauthorized_invalid_token(self, client, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post(
            "/api/v1/game_profiles/",
            json=payload,
            headers={"Authorization": "Bearer invalid_token_string"}
        )
        assert response.status_code == 401

    def test_create_game_profile_duplicate_for_player(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        char_id = seed_catalog_data["characters"][0].character_id
        role_id = seed_catalog_data["roles"][0].role_id
        rank_id = seed_catalog_data["ranks"][0].rank_id

        payload = {
            "videogame_id": vg_id,
            "character_ids": [char_id],
            "roles": [{"role_id": role_id, "rank_id": rank_id}]
        }

        # First creation succeeds
        res1 = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert res1.status_code == 201

        # Second creation fails with domain exception status_code (400)
        res2 = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert res2.status_code == 400
        assert "already has a profile created" in res2.json().get("error", "")

    def test_create_game_profile_videogame_not_found(self, client, player_auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": 99999,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 404
        assert "99999" in response.json().get("error", "")

    def test_create_game_profile_character_not_found(self, client, player_auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [99999],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 404
        assert "99999" in response.json().get("error", "")

    def test_create_game_profile_role_not_found(self, client, player_auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": 99999, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 404
        assert "99999" in response.json().get("error", "")

    def test_create_game_profile_rank_not_found(self, client, player_auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": 99999}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 404
        assert "99999" in response.json().get("error", "")

    def test_create_game_profile_empty_characters_validation(self, client, player_auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [],
            "roles": [{"role_id": seed_catalog_data["roles"][0].role_id, "rank_id": seed_catalog_data["ranks"][0].rank_id}]
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 422

    def test_create_game_profile_empty_roles_validation(self, client, player_auth_headers, seed_catalog_data):
        payload = {
            "videogame_id": seed_catalog_data["videogame"].videogame_id,
            "character_ids": [seed_catalog_data["characters"][0].character_id],
            "roles": []
        }

        response = client.post("/api/v1/game_profiles/", json=payload, headers=player_auth_headers)
        assert response.status_code == 422

    # ---------------------------------------------------------
    # PUT /api/v1/game_profiles/{game_profile_id}
    # ---------------------------------------------------------

    def test_update_game_profile_success(self, client, player_auth_headers, seed_catalog_data):
        vg_id = seed_catalog_data["videogame"].videogame_id
        char1 = seed_catalog_data["characters"][0].character_id
        char2 = seed_catalog_data["characters"][1].character_id
        role1 = seed_catalog_data["roles"][0].role_id
        role2 = seed_catalog_data["roles"][1].role_id
        rank1 = seed_catalog_data["ranks"][0].rank_id
        rank2 = seed_catalog_data["ranks"][1].rank_id

        # 1. Create profile
        create_res = client.post("/api/v1/game_profiles/", json={
            "videogame_id": vg_id,
            "character_ids": [char1],
            "roles": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        assert create_res.status_code == 201
        profile_id = create_res.json()["profile_id"]

        # 2. Update profile
        update_payload = {
            "character_ids": [char2, char1],
            "roles_ranks": [
                {"role_id": role2, "rank_id": rank2}
            ]
        }
        update_res = client.put(f"/api/v1/game_profiles/{profile_id}", json=update_payload, headers=player_auth_headers)

        assert update_res.status_code == 200
        data = update_res.json()
        assert data["game_profile_id"] == profile_id
        assert len(data["characters"]) == 2
        assert len(data["role_profiles"]) == 1
        assert data["role_profiles"][0]["role"]["role_id"] == role2
        assert data["role_profiles"][0]["rank"]["rank_id"] == rank2

    def test_update_game_profile_not_found(self, client, player_auth_headers):
        update_payload = {
            "character_ids": [1],
            "roles_ranks": [{"role_id": 1, "rank_id": 1}]
        }
        response = client.put("/api/v1/game_profiles/99999", json=update_payload, headers=player_auth_headers)
        assert response.status_code == 404

    def test_update_game_profile_does_not_belong_to_player(self, client, player_auth_headers, jwt_service, test_db_session, password_hasher, seed_catalog_data):
        # Create a second player
        other_orm = UserORM(
            name="Other Player",
            username="otherplayer",
            mail="other@player.com",
            password_hash=password_hasher.hash_password("Password123"),
            role="player",
            icon_url="/media/users/icons/other.png"
        )
        test_db_session.add(other_orm)
        test_db_session.commit()
        test_db_session.refresh(other_orm)

        other_token, _, _, _ = jwt_service.generate_tokens(user_id=other_orm.user_id, role=UserRole.PLAYER)
        other_headers = {"Authorization": f"Bearer {other_token}"}

        vg_id = seed_catalog_data["videogame"].videogame_id
        char1 = seed_catalog_data["characters"][0].character_id
        role1 = seed_catalog_data["roles"][0].role_id
        rank1 = seed_catalog_data["ranks"][0].rank_id

        # Player 1 creates profile
        res1 = client.post("/api/v1/game_profiles/", json={
            "videogame_id": vg_id,
            "character_ids": [char1],
            "roles": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        profile_id = res1.json()["profile_id"]

        # Player 2 tries to update Player 1's profile
        update_res = client.put(f"/api/v1/game_profiles/{profile_id}", json={
            "character_ids": [char1],
            "roles_ranks": [{"role_id": role1, "rank_id": rank1}]
        }, headers=other_headers)

        assert update_res.status_code == 400
        assert "no pertenece" in update_res.json().get("error", "").lower()

    def test_update_game_profile_unauthorized(self, client):
        response = client.put("/api/v1/game_profiles/1", json={
            "character_ids": [1],
            "roles_ranks": [{"role_id": 1, "rank_id": 1}]
        })
        assert response.status_code == 401

    # ---------------------------------------------------------
    # USER STORIES 3: Modificar perfil de videojuego
    # ---------------------------------------------------------

    def test_update_profile_overwatch_changing_characters_and_ranks(self, client, player_auth_headers, overwatch_data):
        # Probar modificar un perfil de Overwatch cambiando los personajes registrados y los rangos de los roles (pasa)
        ow = overwatch_data["videogame"]
        chars = overwatch_data["characters"]
        roles = overwatch_data["roles"]
        ranks = overwatch_data["ranks"]

        create_res = client.post("/api/v1/game_profiles/", json={
            "videogame_id": ow.videogame_id,
            "character_ids": [chars["bastion"].character_id],
            "roles": [{"role_id": roles["dano"].role_id, "rank_id": ranks["oro"].rank_id}]
        }, headers=player_auth_headers)
        profile_id = create_res.json()["profile_id"]

        update_res = client.put(f"/api/v1/game_profiles/{profile_id}", json={
            "character_ids": [chars["reaper"].character_id, chars["reinhardt"].character_id],
            "roles_ranks": [{"role_id": roles["dano"].role_id, "rank_id": ranks["platino"].rank_id}]
        }, headers=player_auth_headers)

        assert update_res.status_code == 200
        data = update_res.json()
        char_ids = [c["character_id"] for c in data["characters"]]
        assert chars["reaper"].character_id in char_ids
        assert chars["reinhardt"].character_id in char_ids
        assert chars["bastion"].character_id not in char_ids
        assert data["role_profiles"][0]["rank"]["rank_id"] == ranks["platino"].rank_id

    def test_update_profile_add_playable_character(self, client, player_auth_headers, seed_catalog_data):
        # Probar agregar un personaje jugable al perfil (pasa)
        vg_id = seed_catalog_data["videogame"].videogame_id
        char1 = seed_catalog_data["characters"][0].character_id
        char2 = seed_catalog_data["characters"][1].character_id
        role1 = seed_catalog_data["roles"][0].role_id
        rank1 = seed_catalog_data["ranks"][0].rank_id

        create_res = client.post("/api/v1/game_profiles/", json={
            "videogame_id": vg_id,
            "character_ids": [char1],
            "roles": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        profile_id = create_res.json()["profile_id"]

        update_res = client.put(f"/api/v1/game_profiles/{profile_id}", json={
            "character_ids": [char1, char2],
            "roles_ranks": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        assert update_res.status_code == 200
        assert len(update_res.json()["characters"]) == 2

    def test_update_profile_remove_playable_character(self, client, player_auth_headers, seed_catalog_data):
        # Probar eliminar un personaje jugable del perfil (pasa)
        vg_id = seed_catalog_data["videogame"].videogame_id
        char1 = seed_catalog_data["characters"][0].character_id
        char2 = seed_catalog_data["characters"][1].character_id
        role1 = seed_catalog_data["roles"][0].role_id
        rank1 = seed_catalog_data["ranks"][0].rank_id

        create_res = client.post("/api/v1/game_profiles/", json={
            "videogame_id": vg_id,
            "character_ids": [char1, char2],
            "roles": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        profile_id = create_res.json()["profile_id"]

        update_res = client.put(f"/api/v1/game_profiles/{profile_id}", json={
            "character_ids": [char1],
            "roles_ranks": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        assert update_res.status_code == 200
        data = update_res.json()
        assert len(data["characters"]) == 1
        assert data["characters"][0]["character_id"] == char1

    def test_update_profile_add_unregistered_role_with_valid_rank(self, client, player_auth_headers, seed_catalog_data):
        # Probar agregar un rol que no estaba registrado en el perfil y asignarle un rango válido (pasa)
        vg_id = seed_catalog_data["videogame"].videogame_id
        char1 = seed_catalog_data["characters"][0].character_id
        role1 = seed_catalog_data["roles"][0].role_id
        role2 = seed_catalog_data["roles"][1].role_id
        rank1 = seed_catalog_data["ranks"][0].rank_id
        rank2 = seed_catalog_data["ranks"][1].rank_id

        create_res = client.post("/api/v1/game_profiles/", json={
            "videogame_id": vg_id,
            "character_ids": [char1],
            "roles": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        profile_id = create_res.json()["profile_id"]

        update_res = client.put(f"/api/v1/game_profiles/{profile_id}", json={
            "character_ids": [char1],
            "roles_ranks": [
                {"role_id": role1, "rank_id": rank1},
                {"role_id": role2, "rank_id": rank2}
            ]
        }, headers=player_auth_headers)
        assert update_res.status_code == 200
        data = update_res.json()
        assert len(data["role_profiles"]) == 2
        role_ids = [rp["role"]["role_id"] for rp in data["role_profiles"]]
        assert role1 in role_ids
        assert role2 in role_ids

    def test_update_profile_remove_role(self, client, player_auth_headers, seed_catalog_data):
        # Probar eliminar un rol del perfil (pasa)
        vg_id = seed_catalog_data["videogame"].videogame_id
        char1 = seed_catalog_data["characters"][0].character_id
        role1 = seed_catalog_data["roles"][0].role_id
        role2 = seed_catalog_data["roles"][1].role_id
        rank1 = seed_catalog_data["ranks"][0].rank_id

        create_res = client.post("/api/v1/game_profiles/", json={
            "videogame_id": vg_id,
            "character_ids": [char1],
            "roles": [
                {"role_id": role1, "rank_id": rank1},
                {"role_id": role2, "rank_id": rank1}
            ]
        }, headers=player_auth_headers)
        profile_id = create_res.json()["profile_id"]

        update_res = client.put(f"/api/v1/game_profiles/{profile_id}", json={
            "character_ids": [char1],
            "roles_ranks": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        assert update_res.status_code == 200
        data = update_res.json()
        assert len(data["role_profiles"]) == 1
        assert data["role_profiles"][0]["role"]["role_id"] == role1

    def test_update_profile_modify_role_rank_success(self, client, player_auth_headers, seed_catalog_data):
        # Probar modificar el rango de un rol seleccionando un rango válido de la lista disponible (pasa)
        vg_id = seed_catalog_data["videogame"].videogame_id
        char1 = seed_catalog_data["characters"][0].character_id
        role1 = seed_catalog_data["roles"][0].role_id
        rank1 = seed_catalog_data["ranks"][0].rank_id
        rank2 = seed_catalog_data["ranks"][1].rank_id

        create_res = client.post("/api/v1/game_profiles/", json={
            "videogame_id": vg_id,
            "character_ids": [char1],
            "roles": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        profile_id = create_res.json()["profile_id"]

        update_res = client.put(f"/api/v1/game_profiles/{profile_id}", json={
            "character_ids": [char1],
            "roles_ranks": [{"role_id": role1, "rank_id": rank2}]
        }, headers=player_auth_headers)
        assert update_res.status_code == 200
        data = update_res.json()
        assert data["role_profiles"][0]["rank"]["rank_id"] == rank2

    def test_update_profile_rank_not_available_for_game_fails(self, client, player_auth_headers, seed_catalog_data, test_db_session):
        # Probar modificar un perfil utilizando un rango que no esté disponible para el videojuego (falla)
        other_game = VideogameORM(name="Other Game 2", icon_url="/other.png", rank_per_role=False)
        test_db_session.add(other_game)
        test_db_session.flush()
        other_rank = RankORM(name="Other Rank", value=999, videogame_id=other_game.videogame_id, icon_url="/other_rank.png")
        test_db_session.add(other_rank)
        test_db_session.commit()

        vg_id = seed_catalog_data["videogame"].videogame_id
        char1 = seed_catalog_data["characters"][0].character_id
        role1 = seed_catalog_data["roles"][0].role_id
        rank1 = seed_catalog_data["ranks"][0].rank_id

        create_res = client.post("/api/v1/game_profiles/", json={
            "videogame_id": vg_id,
            "character_ids": [char1],
            "roles": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        profile_id = create_res.json()["profile_id"]

        update_res = client.put(f"/api/v1/game_profiles/{profile_id}", json={
            "character_ids": [char1],
            "roles_ranks": [{"role_id": role1, "rank_id": other_rank.rank_id}]
        }, headers=player_auth_headers)
        assert update_res.status_code == 400
        assert "no pertenece" in update_res.json().get("error", "").lower()

    def test_update_profile_role_not_registered_fails(self, client, player_auth_headers, seed_catalog_data):
        # Probar modificar un perfil asignando un rango correspondiente a un rol que no está registrado (falla)
        vg_id = seed_catalog_data["videogame"].videogame_id
        char1 = seed_catalog_data["characters"][0].character_id
        role1 = seed_catalog_data["roles"][0].role_id
        rank1 = seed_catalog_data["ranks"][0].rank_id

        create_res = client.post("/api/v1/game_profiles/", json={
            "videogame_id": vg_id,
            "character_ids": [char1],
            "roles": [{"role_id": role1, "rank_id": rank1}]
        }, headers=player_auth_headers)
        profile_id = create_res.json()["profile_id"]

        update_res = client.put(f"/api/v1/game_profiles/{profile_id}", json={
            "character_ids": [char1],
            "roles_ranks": [{"role_id": 99999, "rank_id": rank1}]
        }, headers=player_auth_headers)
        assert update_res.status_code == 404

    # ---------------------------------------------------------
    # USER STORIES 16: Buscar jugadores
    # ---------------------------------------------------------

    @pytest.fixture
    def second_player_with_profile(self, test_db_session, password_hasher, seed_catalog_data):
        player2 = UserORM(
            name="Alex Competitive",
            username="alexcomp",
            mail="alex@example.com",
            password_hash=password_hasher.hash_password("Password123"),
            role="player",
            icon_url="/media/users/icons/alex.png",
            last_connection=datetime.now()
        )
        test_db_session.add(player2)
        test_db_session.flush()

        gp2 = GameProfileORM(
            player_id=player2.user_id,
            videogame_id=seed_catalog_data["videogame"].videogame_id
        )
        test_db_session.add(gp2)
        test_db_session.flush()

        cp = CharacterPriorityORM(
            game_profile_id=gp2.game_profile_id,
            character_id=seed_catalog_data["characters"][0].character_id,
            priority=1
        )
        rp = RoleProfileORM(
            game_profile_id=gp2.game_profile_id,
            role_id=seed_catalog_data["roles"][0].role_id,
            rank_id=seed_catalog_data["ranks"][0].rank_id
        )
        test_db_session.add_all([cp, rp])
        test_db_session.commit()
        return player2, gp2

    def test_search_players_by_videogame_only(self, client, player_auth_headers, seed_catalog_data, second_player_with_profile):
        # Probar buscar jugadores seleccionando únicamente un videojuego (pasa)
        vg_id = seed_catalog_data["videogame"].videogame_id
        payload = {"videogame_id": vg_id}

        response = client.post("/api/v1/game_profiles/search", json=payload, headers=player_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "videogame_profiles" in data
        assert len(data["videogame_profiles"]) >= 1
        found_player_ids = [p["player"]["player_id"] for p in data["videogame_profiles"]]
        assert second_player_with_profile[0].user_id in found_player_ids

    def test_search_players_combined_filters(self, client, player_auth_headers, seed_catalog_data, second_player_with_profile):
        # Probar buscar jugadores aplicando filtros combinados de juego, rango, rol y personaje (pasa)
        vg_id = seed_catalog_data["videogame"].videogame_id
        char_id = seed_catalog_data["characters"][0].character_id
        role_id = seed_catalog_data["roles"][0].role_id
        rank_id = seed_catalog_data["ranks"][0].rank_id

        payload = {
            "videogame_id": vg_id,
            "characters": [char_id],
            "roles": [role_id],
            "ranks": [rank_id]
        }
        response = client.post("/api/v1/game_profiles/search", json=payload, headers=player_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["videogame_profiles"]) >= 1
        assert data["videogame_profiles"][0]["player"]["player_id"] == second_player_with_profile[0].user_id

    def test_search_players_filtering_by_last_connection(self, client, player_auth_headers, seed_catalog_data, test_db_session, password_hasher):
        # Probar buscar jugadores filtrando por última conexión (pasa)
        inactive_player = UserORM(
            name="Inactive Player",
            username="inactiveplayer",
            mail="inactive@example.com",
            password_hash=password_hasher.hash_password("Password123"),
            role="player",
            icon_url="/media/users/icons/inactive.png",
            last_connection=datetime.now() - timedelta(days=10)
        )
        test_db_session.add(inactive_player)
        test_db_session.flush()

        gp_inactive = GameProfileORM(
            player_id=inactive_player.user_id,
            videogame_id=seed_catalog_data["videogame"].videogame_id
        )
        test_db_session.add(gp_inactive)
        test_db_session.commit()

        payload = {"videogame_id": seed_catalog_data["videogame"].videogame_id}
        response = client.post("/api/v1/game_profiles/search", json=payload, headers=player_auth_headers)
        assert response.status_code == 200
        found_player_ids = [p["player"]["player_id"] for p in response.json()["videogame_profiles"]]
        assert inactive_player.user_id not in found_player_ids

    def test_search_players_by_name(self, client, player_auth_headers, seed_catalog_data, second_player_with_profile):
        # Probar buscar jugadores introduciendo un nombre o parte del nombre en el buscador (pasa)
        vg_id = seed_catalog_data["videogame"].videogame_id
        payload = {
            "videogame_id": vg_id,
            "name": "alex"
        }
        response = client.post("/api/v1/game_profiles/search", json=payload, headers=player_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["videogame_profiles"]) >= 1
        assert "alex" in data["videogame_profiles"][0]["player"]["player_name"].lower()

    def test_search_players_no_matching_results(self, client, player_auth_headers, seed_catalog_data):
        # Probar realizar una búsqueda de jugadores sin obtener resultados coincidentes (pasa)
        vg_id = seed_catalog_data["videogame"].videogame_id
        payload = {
            "videogame_id": vg_id,
            "name": "NonExistentPlayerXYZ"
        }
        response = client.post("/api/v1/game_profiles/search", json=payload, headers=player_auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["videogame_profiles"] == []

