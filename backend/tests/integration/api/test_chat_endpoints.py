from datetime import datetime, timedelta
import pytest
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.database.models.message_orm import MessageORM
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
            icon_url="/media/users/icons/janedoe.png",
            last_connection=datetime.now()
        )
        test_db_session.add(player2)
        test_db_session.commit()
        test_db_session.refresh(player2)
        return player2

    @pytest.fixture(scope="function")
    def second_player_token(self, jwt_service, second_player):
        token, _, _, _ = jwt_service.generate_tokens(user_id=second_player.user_id, role=UserRole.PLAYER)
        return token

    # ---------------------------------------------------------
    # STORIES 12 & 13: Iniciar conversación privada
    # ---------------------------------------------------------

    def test_start_conversation_without_previous_history(self, client, player_auth_headers, second_player):
        # Probar iniciar una conversación privada desde la tarjeta de jugador cuando no existe historial previo (pasa)
        response = client.post(
            "/api/v1/chat",
            json={"target_user_id": second_player.user_id},
            headers=player_auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "conversation_id" in data
        assert data["conversation_id"] is not None

        # Verificar que el historial inicial de mensajes está vacío
        conv_id = data["conversation_id"]
        msg_res = client.get(f"/api/v1/chat/conversations/{conv_id}/messages", headers=player_auth_headers)
        assert msg_res.status_code == 200
        assert msg_res.json()["messages"] == []

    def test_start_conversation_with_previous_history(self, client, player_auth_headers, second_player):
        # Probar iniciar una conversación privada desde la tarjeta de un jugador cuando ya existe una conversación previa (pasa)
        # Primera llamada crea la conversación
        res1 = client.post(
            "/api/v1/chat",
            json={"target_user_id": second_player.user_id},
            headers=player_auth_headers
        )
        assert res1.status_code == 200
        conv_id_1 = res1.json()["conversation_id"]

        # Segunda llamada devuelve la conversación existente
        res2 = client.post(
            "/api/v1/chat",
            json={"target_user_id": second_player.user_id},
            headers=player_auth_headers
        )
        assert res2.status_code == 200
        conv_id_2 = res2.json()["conversation_id"]
        assert conv_id_1 == conv_id_2

    def test_start_conversation_with_self_blocked(self, client, player_auth_headers, seed_player):
        # Probar intentar iniciar una conversación privada desde la tarjeta del propio usuario (pasa / bloqueado)
        response = client.post(
            "/api/v1/chat",
            json={"target_user_id": seed_player.user_id},
            headers=player_auth_headers
        )
        assert response.status_code == 400
        assert "no podés iniciar una conversación con vos mismo" in response.json().get("error", "").lower()

    def test_start_conversation_target_user_not_found(self, client, player_auth_headers):
        # Probar iniciar una conversación privada ante un fallo / usuario no encontrado (falla con 404)
        response = client.post(
            "/api/v1/chat",
            json={"target_user_id": 99999},
            headers=player_auth_headers
        )
        assert response.status_code == 404

    def test_list_my_conversations_flow(self, client, player_auth_headers, second_player):
        # Iniciar conversación y verificar que aparece en el listado
        client.post("/api/v1/chat", json={"target_user_id": second_player.user_id}, headers=player_auth_headers)
        list_res = client.get("/api/v1/chat/conversations", headers=player_auth_headers)
        assert list_res.status_code == 200
        convs = list_res.json()["conversations"]
        assert len(convs) == 1
        assert convs[0]["other_participant"]["user_id"] == second_player.user_id

    # ---------------------------------------------------------
    # STORY 14: Enviar y recibir mensajes
    # ---------------------------------------------------------

    def test_websocket_send_and_receive_valid_text_message(self, client, jwt_service, seed_player, second_player):
        # Probar enviar el mensaje de texto válido en una conversación privada (pasa)
        # Probar recibir un mensaje de texto en tiempo real de otro jugador (pasa)
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

        with client.websocket_connect(f"/api/v1/ws/chat/conversations/{conv_id}?token={token1}") as ws1:
            with client.websocket_connect(f"/api/v1/ws/chat/conversations/{conv_id}?token={token2}") as ws2:
                # ws1 envía mensaje de texto válido
                ws1.send_json({"content": "Hola Jane! Quieres jugar?"})

                # ws1 recibe el broadcast con sender y timestamp
                msg1 = ws1.receive_json()
                assert msg1["content"] == "Hola Jane! Quieres jugar?"
                assert msg1["sender_id"] == seed_player.user_id
                assert msg1["conversation_id"] == conv_id
                assert "timestamp" in msg1

                # ws2 recibe en tiempo real
                msg2 = ws2.receive_json()
                assert msg2["content"] == "Hola Jane! Quieres jugar?"
                assert msg2["sender_id"] == seed_player.user_id
                assert msg2["conversation_id"] == conv_id

    def test_websocket_send_empty_or_whitespace_message_rejected(self, client, jwt_service, seed_player, second_player):
        # Probar a enviar un mensaje de texto vacío o compuesto de espacios en blanco (no pasa)
        token1, _, _, _ = jwt_service.generate_tokens(user_id=seed_player.user_id, role=UserRole.PLAYER)
        headers1 = {"Authorization": f"Bearer {token1}"}
        create_res = client.post(
            "/api/v1/chat",
            json={"target_user_id": second_player.user_id},
            headers=headers1
        )
        conv_id = create_res.json()["conversation_id"]

        with client.websocket_connect(f"/api/v1/ws/chat/conversations/{conv_id}?token={token1}") as ws:
            # Enviar mensaje con espacios en blanco
            ws.send_json({"content": "   "})
            response = ws.receive_json()
            assert "error" in response

    # ---------------------------------------------------------
    # STORY 15: Recuperar mensajes de una conversación privada
    # ---------------------------------------------------------

    def test_get_conversation_messages_existing_history(self, client, player_auth_headers, seed_player, second_player, test_db_session):
        # Probar recuperar el historial de una conversación privada existente al abrir el chat (pasa)
        create_res = client.post("/api/v1/chat", json={"target_user_id": second_player.user_id}, headers=player_auth_headers)
        conv_id = create_res.json()["conversation_id"]

        # Insertar mensajes en historial
        msg1 = MessageORM(conversation_id=conv_id, sender_id=seed_player.user_id, content="Primer mensaje", timestamp=datetime.now() - timedelta(minutes=5), is_read=True)
        msg2 = MessageORM(conversation_id=conv_id, sender_id=second_player.user_id, content="Segundo mensaje", timestamp=datetime.now() - timedelta(minutes=3), is_read=True)
        test_db_session.add_all([msg1, msg2])
        test_db_session.commit()

        # Abrir chat y recuperar mensajes
        response = client.get(f"/api/v1/chat/conversations/{conv_id}/messages", headers=player_auth_headers)
        assert response.status_code == 200
        messages = response.json()["messages"]
        assert len(messages) == 2
        assert messages[0]["content"] == "Segundo mensaje"
        assert messages[1]["content"] == "Primer mensaje"

    def test_get_conversation_messages_empty_history(self, client, player_auth_headers, second_player):
        # Probar abrir el chat cuando no existe historial previo de mensajes (pasa, sin error)
        create_res = client.post("/api/v1/chat", json={"target_user_id": second_player.user_id}, headers=player_auth_headers)
        conv_id = create_res.json()["conversation_id"]

        response = client.get(f"/api/v1/chat/conversations/{conv_id}/messages", headers=player_auth_headers)
        assert response.status_code == 200
        assert response.json()["messages"] == []

    def test_get_conversation_messages_pagination(self, client, player_auth_headers, seed_player, second_player, test_db_session):
        # Probar la paginación o carga progresiva al desplazarse hacia arriba en un historial de mensajes extenso (pasa)
        create_res = client.post("/api/v1/chat", json={"target_user_id": second_player.user_id}, headers=player_auth_headers)
        conv_id = create_res.json()["conversation_id"]

        # Crear 10 mensajes
        messages = [
            MessageORM(
                conversation_id=conv_id,
                sender_id=seed_player.user_id,
                content=f"Mensaje {i}",
                timestamp=datetime.now() - timedelta(minutes=10 - i),
                is_read=True
            ) for i in range(10)
        ]
        test_db_session.add_all(messages)
        test_db_session.commit()

        # Página 1 con tamaño 5
        res_page1 = client.get(f"/api/v1/chat/conversations/{conv_id}/messages?page=1&size=5", headers=player_auth_headers)
        assert res_page1.status_code == 200
        page1_msgs = res_page1.json()["messages"]
        assert len(page1_msgs) == 5

        # Página 2 con tamaño 5
        res_page2 = client.get(f"/api/v1/chat/conversations/{conv_id}/messages?page=2&size=5", headers=player_auth_headers)
        assert res_page2.status_code == 200
        page2_msgs = res_page2.json()["messages"]
        assert len(page2_msgs) == 5

        # Los mensajes de ambas páginas no deben solaparse
        page1_ids = {m["message_id"] for m in page1_msgs}
        page2_ids = {m["message_id"] for m in page2_msgs}
        assert page1_ids.isdisjoint(page2_ids)

    def test_get_conversation_messages_user_not_belonging_forbidden(self, client, jwt_service, seed_player, second_player, test_db_session, password_hasher):
        # Probar que un usuario ajeno a la conversación no puede leer sus mensajes (403)
        third_player = UserORM(
            name="Intruder",
            username="intruder",
            mail="intruder@example.com",
            password_hash=password_hasher.hash_password("Password123"),
            role="player",
            icon_url="/intruder.png"
        )
        test_db_session.add(third_player)
        test_db_session.commit()

        token1, _, _, _ = jwt_service.generate_tokens(user_id=seed_player.user_id, role=UserRole.PLAYER)
        token3, _, _, _ = jwt_service.generate_tokens(user_id=third_player.user_id, role=UserRole.PLAYER)

        create_res = client.post(
            "/api/v1/chat",
            json={"target_user_id": second_player.user_id},
            headers={"Authorization": f"Bearer {token1}"}
        )
        conv_id = create_res.json()["conversation_id"]

        # Tercer jugador intenta acceder a la conversación ajena
        forbidden_res = client.get(
            f"/api/v1/chat/conversations/{conv_id}/messages",
            headers={"Authorization": f"Bearer {token3}"}
        )
        assert forbidden_res.status_code == 403

    def test_get_conversation_messages_unauthorized(self, client):
        # Probar acceder a los mensajes sin autenticación (401)
        response = client.get("/api/v1/chat/conversations/1/messages")
        assert response.status_code == 401
