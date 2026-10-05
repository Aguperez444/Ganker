from unittest.mock import MagicMock
from datetime import datetime
import pytest

from app.application.use_cases.get_or_create_conversation import GetOrCreateConversation
from app.application.use_cases.save_message import SaveMessage
from app.application.use_cases.get_messages import GetMessages
from app.domain.models.conversation import Conversation
from app.domain.models.conversation_member import ConversationMember
from app.domain.models.message import Message
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.exceptions.chat.cannot_start_conversation_with_self_exception import CannotStartConversationWithSelfException
from app.domain.exceptions.chat.message_is_empty_exception import MessageIsEmptyException
from app.domain.exceptions.chat.conversation_not_found_exception import ConversationNotFoundException
from app.domain.exceptions.chat.user_does_not_belong_to_conversation_exception import UserDoesNotBelongToConversationException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException


class TestChatUseCases:

    @pytest.fixture
    def mock_uow(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.conversation_repo = MagicMock()
        uow.message_repo = MagicMock()
        uow.user_repo = MagicMock()
        return uow

    # ---------------------------------------------------------
    # STORIES 12 & 13: GetOrCreateConversation
    # ---------------------------------------------------------

    def test_get_or_create_conversation_new_conversation(self, mock_uow):
        # Probar iniciar una conversación privada desde la tarjeta de jugador cuando no existe historial previo (pasa)
        use_case = GetOrCreateConversation(mock_uow)

        user1 = User(user_id=1, username="u1", name="User 1", mail="u1@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])
        user2 = User(user_id=2, username="u2", name="User 2", mail="u2@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])

        mock_uow.user_repo.get_user_by_id.side_effect = lambda uid: user1 if uid == 1 else user2
        mock_uow.conversation_repo.find_by_participants_ids.return_value = None

        new_conv = Conversation(conversation_id=10, members=[ConversationMember(None, 10, user1), ConversationMember(None, 10, user2)], messages=[])
        mock_uow.conversation_repo.create_conversation.return_value = new_conv

        result = use_case.execute(current_user_id=1, target_user_id=2)

        assert result.conversation_id == 10
        mock_uow.conversation_repo.create_conversation.assert_called_once()

    def test_get_or_create_conversation_existing(self, mock_uow):
        # Probar iniciar una conversación privada desde la tarjeta de un jugador cuando ya existe una conversación previa (pasa)
        use_case = GetOrCreateConversation(mock_uow)

        user1 = User(user_id=1, username="u1", name="User 1", mail="u1@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])
        user2 = User(user_id=2, username="u2", name="User 2", mail="u2@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])

        mock_uow.user_repo.get_user_by_id.side_effect = lambda uid: user1 if uid == 1 else user2
        existing = Conversation(conversation_id=10, members=[ConversationMember(None, 10, user1), ConversationMember(None, 10, user2)], messages=[])
        mock_uow.conversation_repo.find_by_participants_ids.return_value = existing

        result = use_case.execute(current_user_id=1, target_user_id=2)

        assert result.conversation_id == 10
        mock_uow.conversation_repo.create_conversation.assert_not_called()

    def test_get_or_create_conversation_with_self_blocked(self, mock_uow):
        # Probar intentar iniciar una conversación privada desde la tarjeta del propio usuario (pasa / bloqueado)
        use_case = GetOrCreateConversation(mock_uow)

        with pytest.raises(CannotStartConversationWithSelfException):
            use_case.execute(current_user_id=1, target_user_id=1)

    def test_get_or_create_conversation_user_not_found(self, mock_uow):
        # Probar fallo cuando el usuario destino no existe
        use_case = GetOrCreateConversation(mock_uow)
        mock_uow.user_repo.get_user_by_id.return_value = None

        with pytest.raises(UserNotFoundException):
            use_case.execute(current_user_id=1, target_user_id=999)

    # ---------------------------------------------------------
    # STORY 14: SaveMessage
    # ---------------------------------------------------------

    def test_save_message_valid_text(self, mock_uow):
        # Probar enviar el mensaje de texto válido en una conversación privada (pasa)
        use_case = SaveMessage(mock_uow)

        sender = User(user_id=1, username="u1", name="User 1", mail="u1@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])
        mock_uow.user_repo.get_user_by_id.return_value = sender

        saved_msg = Message(message_id=5, content="Hola!", sender=sender, conversation_id=10, timestamp=datetime.now(), is_read=False)
        mock_uow.message_repo.save_message.return_value = saved_msg

        result = use_case.execute(conversation_id=10, sender_id=1, content="Hola!", is_read=False)

        assert result.content == "Hola!"
        assert result.sender_id == 1
        assert result.conversation_id == 10
        mock_uow.message_repo.save_message.assert_called_once()

    def test_save_message_empty_text_raises_exception(self, mock_uow):
        # Probar a enviar un mensaje de texto vacío (no pasa)
        use_case = SaveMessage(mock_uow)

        with pytest.raises(MessageIsEmptyException):
            use_case.execute(conversation_id=10, sender_id=1, content="")

    def test_save_message_whitespace_only_raises_exception(self, mock_uow):
        # Probar a enviar un mensaje de texto compuesto de espacios en blanco (no pasa)
        use_case = SaveMessage(mock_uow)

        with pytest.raises(MessageIsEmptyException):
            use_case.execute(conversation_id=10, sender_id=1, content="     ")

    # ---------------------------------------------------------
    # STORY 15: GetMessages
    # ---------------------------------------------------------

    def test_get_messages_existing_history(self, mock_uow):
        # Probar recuperar el historial de una conversación privada existente al abrir el chat (pasa)
        use_case = GetMessages(mock_uow)

        user1 = User(user_id=1, username="u1", name="User 1", mail="u1@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])
        user2 = User(user_id=2, username="u2", name="User 2", mail="u2@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])
        conv = Conversation(conversation_id=10, members=[ConversationMember(None, 10, user1), ConversationMember(None, 10, user2)], messages=[])
        mock_uow.conversation_repo.get_by_conversation_id.return_value = conv

        msg1 = Message(message_id=1, content="Hola", sender=user1, conversation_id=10, timestamp=datetime.now(), is_read=True)
        msg2 = Message(message_id=2, content="Chau", sender=user2, conversation_id=10, timestamp=datetime.now(), is_read=True)
        mock_uow.message_repo.get_by_conversation_id.return_value = [msg1, msg2]

        result = use_case.execute(conversation_id=10, user_id=1, page=1, size=30)

        assert len(result.messages) == 2
        assert result.messages[0].content == "Hola"
        assert result.messages[1].content == "Chau"

    def test_get_messages_empty_history(self, mock_uow):
        # Probar abrir el chat cuando no existe historial previo de mensajes (pasa, sin error)
        use_case = GetMessages(mock_uow)

        user1 = User(user_id=1, username="u1", name="User 1", mail="u1@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])
        user2 = User(user_id=2, username="u2", name="User 2", mail="u2@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])
        conv = Conversation(conversation_id=10, members=[ConversationMember(None, 10, user1), ConversationMember(None, 10, user2)], messages=[])
        mock_uow.conversation_repo.get_by_conversation_id.return_value = conv
        mock_uow.message_repo.get_by_conversation_id.return_value = []

        result = use_case.execute(conversation_id=10, user_id=1, page=1, size=30)

        assert result.messages == []

    def test_get_messages_pagination(self, mock_uow):
        # Probar la paginación o carga progresiva en un historial de mensajes extenso (pasa)
        use_case = GetMessages(mock_uow)

        user1 = User(user_id=1, username="u1", name="User 1", mail="u1@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])
        user2 = User(user_id=2, username="u2", name="User 2", mail="u2@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])
        conv = Conversation(conversation_id=10, members=[ConversationMember(None, 10, user1), ConversationMember(None, 10, user2)], messages=[])
        mock_uow.conversation_repo.get_by_conversation_id.return_value = conv
        mock_uow.message_repo.get_by_conversation_id.return_value = []

        use_case.execute(conversation_id=10, user_id=1, page=3, size=15)

        # skip = (3 - 1) * 15 = 30, limit = 15
        mock_uow.message_repo.get_by_conversation_id.assert_called_once_with(10, 30, 15)

    def test_get_messages_user_not_belonging_raises_exception(self, mock_uow):
        # Probar que si el usuario no pertenece a la conversación se lanza excepción
        use_case = GetMessages(mock_uow)

        user1 = User(user_id=1, username="u1", name="User 1", mail="u1@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])
        user2 = User(user_id=2, username="u2", name="User 2", mail="u2@test.com", password_hash="h", role=UserRole.PLAYER, profiles=[])
        conv = Conversation(conversation_id=10, members=[ConversationMember(None, 10, user1), ConversationMember(None, 10, user2)], messages=[])
        mock_uow.conversation_repo.get_by_conversation_id.return_value = conv

        with pytest.raises(UserDoesNotBelongToConversationException) as exc_info:
            use_case.execute(conversation_id=10, user_id=99, page=1, size=30)

        assert exc_info.value.status_code == 403

    def test_get_messages_conversation_not_found_raises_exception(self, mock_uow):
        # Probar que si la conversación no existe se lanza excepción
        use_case = GetMessages(mock_uow)
        mock_uow.conversation_repo.get_by_conversation_id.return_value = None

        with pytest.raises(ConversationNotFoundException) as exc_info:
            use_case.execute(conversation_id=999, user_id=1, page=1, size=30)

        assert exc_info.value.status_code == 404
