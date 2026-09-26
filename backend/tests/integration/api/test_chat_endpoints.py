import pytest
from app.infrastructure.database.models.user_orm import UserORM
from app.domain.models.user_role import UserRole


class TestChatEndpointsIntegration:

    @pytest.fixture(scope="function")
    def second_player(self, test_db_session, password_hasher):
        player2 = UserORM(
            name="Jane Doe",
            username="janedoe",
            mail="jane.doe@example.com",
            password_hash=password_hasher.hash_password("Password123"),
            role="player",
            icon_url="/media/users/icons/janedoe.png"
        )
        test_db_session.add(player2)
        test_db_session.commit()
        test_db_session.refresh(player2)
        return player2

    @pytest.fixture(scope="function")
    def second_player_token(self, jwt_service, second_player):
        token, _, _, _ = jwt_service.generate_tokens(user_id=second_player.user_id, role=UserRole.PLAYER)
        return token

    def test_start_or_get_conversation_flow(self, client, player_auth_headers, seed_player, second_player):
        # 1. Crear conversación
        response = client.post(
            "/api/v1/chat",
            json={"target_user_id": second_player.user_id},
            headers=player_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "conversation_id" in data
        assert data["conversation_id"] is not None
        conv_id = data["conversation_id"]

        # 2. Re-consultar la misma conversación (debe devolver la existente)
        response2 = client.post(
            "/api/v1/chat",
            json={"target_user_id": second_player.user_id},
            headers=player_auth_headers
        )
        assert response2.status_code == 200
        assert response2.json()["conversation_id"] == conv_id

        # 3. Listar conversaciones
        list_res = client.get("/api/v1/chat/conversations", headers=player_auth_headers)
        assert list_res.status_code == 200
        convs = list_res.json()["conversations"]
        assert len(convs) == 1
        assert convs[0]["conversation_id"] == conv_id
        assert convs[0]["other_participant"]["user_id"] == second_player.user_id
        assert convs[0]["last_message"] is None

    def test_websocket_chat_flow(self, client, jwt_service, seed_player, second_player):
        # 1. Iniciar conversación vía REST
        token1, _, _, _ = jwt_service.generate_tokens(user_id=seed_player.user_id, role=UserRole.PLAYER)
        token2, _, _, _ = jwt_service.generate_tokens(user_id=second_player.user_id, role=UserRole.PLAYER)

        headers1 = {"Authorization": f"Bearer {token1}"}
        create_res = client.post(
            "/api/v1/chat",
            json={"target_user_id": second_player.user_id},
            headers=headers1
        )
        assert create_res.status_code == 200
        conv_id = create_res.json()["conversation_id"]

        # 2. Conectar dos clientes por WebSocket
        with client.websocket_connect(f"/api/v1/ws/chat/conversations/{conv_id}?token={token1}") as ws1:
            with client.websocket_connect(f"/api/v1/ws/chat/conversations/{conv_id}?token={token2}") as ws2:
                # ws1 envía mensaje
                ws1.send_json({"content": "Hola Jane!"})

                # ws1 recibe el broadcast
                msg1 = ws1.receive_json()
                assert msg1["content"] == "Hola Jane!"
                assert msg1["sender_id"] == seed_player.user_id
                assert msg1["conversation_id"] == conv_id

                # ws2 recibe el broadcast
                msg2 = ws2.receive_json()
                assert msg2["content"] == "Hola Jane!"
                assert msg2["sender_id"] == seed_player.user_id
                assert msg2["conversation_id"] == conv_id
