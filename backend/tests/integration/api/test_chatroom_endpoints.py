from datetime import datetime

import pytest

from app.domain.models.conversation_type_enum import ConversationTypeEnum
from app.domain.models.user_role import UserRole
from app.infrastructure.database.models.conversation_member_orm import ConversationMemberORM
from app.infrastructure.database.models.conversation_orm import ConversationORM
from app.infrastructure.database.models.user_orm import UserORM


class TestChatroomEndpointsIntegration:

    def _create_user(self, session, password_hasher, username):
        user = UserORM(
            name=username.capitalize(),
            username=username,
            mail=f"{username}@example.com",
            password_hash=password_hasher.hash_password("Password123"),
            role="player",
            icon_url=None,
            last_connection=datetime.now()
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

    @pytest.fixture(scope="function")
    def second_player(self, test_db_session, password_hasher):
        return self._create_user(test_db_session, password_hasher, "janedoe")

    @pytest.fixture(scope="function")
    def outsider(self, test_db_session, password_hasher):
        return self._create_user(test_db_session, password_hasher, "outsider")

    @pytest.fixture(scope="function")
    def chatroom(self, test_db_session, seed_player, second_player):
        conv = ConversationORM(type=ConversationTypeEnum.GROUP.value, name="Chat del equipo Test")
        conv.members = [
            ConversationMemberORM(user_id=seed_player.user_id, role=1),
            ConversationMemberORM(user_id=second_player.user_id, role=2),
        ]
        test_db_session.add(conv)
        test_db_session.commit()
        test_db_session.refresh(conv)
        return conv

    @staticmethod
    def _headers(jwt_service, user):
        token, _, _, _ = jwt_service.generate_tokens(user_id=user.user_id, role=UserRole.PLAYER)
        return {"Authorization": f"Bearer {token}"}, token

    def test_list_chatrooms_only_returns_group_conversations(self, client, player_auth_headers, second_player, chatroom):
        client.post("/api/v1/chat", json={"target_user_id": second_player.user_id}, headers=player_auth_headers)

        chatrooms = client.get("/api/v1/chat/chatroom", headers=player_auth_headers).json()["chatrooms"]
        assert [c["chatroom_id"] for c in chatrooms] == [chatroom.conversation_id]
        assert chatrooms[0]["member_count"] == 2
        assert chatrooms[0]["unread_count"] == 0

        # Los chatrooms no se mezclan con las conversaciones privadas
        convs = client.get("/api/v1/chat/conversations", headers=player_auth_headers).json()["conversations"]
        assert len(convs) == 1
        assert convs[0]["conversation_id"] != chatroom.conversation_id

    def test_private_endpoints_reject_group_conversation(self, client, player_auth_headers, chatroom):
        assert client.get(f"/api/v1/chat/conversations/{chatroom.conversation_id}/messages",
                          headers=player_auth_headers).status_code == 404
        assert client.patch(f"/api/v1/chat/conversations/{chatroom.conversation_id}/read",
                            headers=player_auth_headers).status_code == 404

    def test_chatroom_messages_forbidden_for_non_member(self, client, jwt_service, outsider, chatroom):
        headers, _ = self._headers(jwt_service, outsider)
        res = client.get(f"/api/v1/chat/chatroom/{chatroom.conversation_id}/messages", headers=headers)
        assert res.status_code == 403
        res = client.patch(f"/api/v1/chat/chatroom/{chatroom.conversation_id}/read", headers=headers)
        assert res.status_code == 403

    def test_chatroom_not_found(self, client, player_auth_headers):
        assert client.get("/api/v1/chat/chatroom/9999/messages", headers=player_auth_headers).status_code == 404

    def test_chatroom_endpoints_reject_private_conversation(self, client, player_auth_headers, second_player):
        conv_id = client.post("/api/v1/chat", json={"target_user_id": second_player.user_id},
                              headers=player_auth_headers).json()["conversation_id"]
        assert client.get(f"/api/v1/chat/chatroom/{conv_id}/messages", headers=player_auth_headers).status_code == 404

    def test_websocket_chatroom_message_flow_and_per_member_unread(
            self, client, jwt_service, seed_player, second_player, chatroom, player_auth_headers):
        cid = chatroom.conversation_id
        _, token1 = self._headers(jwt_service, seed_player)
        headers2, token2 = self._headers(jwt_service, second_player)

        # seed_player escribe mientras second_player no está conectado
        with client.websocket_connect(f"/api/v1/ws/chat/chatroom/{cid}?token={token1}") as ws1:
            ws1.send_json({"content": "  hola equipo  "})
            received = ws1.receive_json()
            assert received["content"] == "hola equipo"
            assert received["sender_username"] == seed_player.username
            assert received["chatroom_id"] == cid

        # Para el emisor no hay no leídos; para el otro miembro sí
        mine = client.get("/api/v1/chat/chatroom", headers=player_auth_headers).json()["chatrooms"][0]
        assert mine["unread_count"] == 0
        theirs = client.get("/api/v1/chat/chatroom", headers=headers2).json()["chatrooms"][0]
        assert theirs["unread_count"] == 1
        assert theirs["last_message"]["content"] == "hola equipo"

        # El mensaje es visible en el historial para ambos miembros
        msgs = client.get(f"/api/v1/chat/chatroom/{cid}/messages", headers=headers2).json()["messages"]
        assert len(msgs) == 1 and msgs[0]["sender_id"] == seed_player.user_id

        # Marcar como leído solo afecta al miembro que lo marca
        res = client.patch(f"/api/v1/chat/chatroom/{cid}/read", headers=headers2)
        assert res.json()["messages_marked"] == 1
        assert client.get("/api/v1/chat/chatroom", headers=headers2).json()["chatrooms"][0]["unread_count"] == 0
        assert client.patch(f"/api/v1/chat/chatroom/{cid}/read", headers=headers2).json()["messages_marked"] == 0

        # Con ambos conectados, el mensaje llega a los dos y no queda como no leído
        with client.websocket_connect(f"/api/v1/ws/chat/chatroom/{cid}?token={token1}") as ws1:
            with client.websocket_connect(f"/api/v1/ws/chat/chatroom/{cid}?token={token2}") as ws2:
                ws2.send_json({"content": "buenas"})
                assert ws1.receive_json()["content"] == "buenas"
                assert ws2.receive_json()["content"] == "buenas"
        assert client.get("/api/v1/chat/chatroom", headers=player_auth_headers).json()["chatrooms"][0]["unread_count"] == 0

    def test_websocket_chatroom_rejects_non_member_and_empty_message(
            self, client, jwt_service, seed_player, outsider, chatroom):
        cid = chatroom.conversation_id
        _, outsider_token = self._headers(jwt_service, outsider)
        with pytest.raises(Exception):
            with client.websocket_connect(f"/api/v1/ws/chat/chatroom/{cid}?token={outsider_token}") as ws:
                ws.receive_json()

        _, token1 = self._headers(jwt_service, seed_player)
        with client.websocket_connect(f"/api/v1/ws/chat/chatroom/{cid}?token={token1}") as ws:
            ws.send_json({"content": "   "})
            assert "error" in ws.receive_json()
