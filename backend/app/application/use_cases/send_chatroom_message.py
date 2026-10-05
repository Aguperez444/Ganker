from datetime import datetime

from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.use_cases.chatroom_access import get_chatroom_for_member
from app.domain.exceptions.chat.message_is_empty_exception import MessageIsEmptyException
from app.domain.models.message import Message
from app.infrastructure.api.dto.response.chatroom_response import ChatroomMessageResponse


class SendChatroomMessage:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, chatroom_id: int, sender_id: int, content: str,
                online_user_ids: set[int] | None = None) -> tuple[ChatroomMessageResponse, list[int]]:
        """
        Guarda un mensaje en el chatroom. Valida la membresía en cada mensaje porque la composición del equipo puede cambiar.
        Los miembros que estén online en el chatroom (y el emisor) quedan con el mensaje como leído.
        Retorna el mensaje persistido y los IDs de todos los miembros del chatroom.
        """
        clean_content = content.strip()
        if not clean_content:
            raise MessageIsEmptyException()

        with self._uow as uow:
            chatroom = get_chatroom_for_member(uow, chatroom_id, sender_id)
            sender = chatroom.get_member(sender_id).user

            saved = uow.message_repo.save_message(Message(None, clean_content, sender, chatroom_id, datetime.now(), False))

            readers = (online_user_ids or set()) | {sender_id}
            member_ids = [m.user.user_id for m in chatroom.members]
            for member_id in member_ids:
                if member_id in readers:
                    uow.conversation_repo.update_last_read_message(chatroom_id, member_id, saved.message_id)

            response = ChatroomMessageResponse(
                message_id=saved.message_id,
                chatroom_id=chatroom_id,
                sender_id=sender.user_id,
                sender_username=sender.username,
                sender_name=sender.name,
                sender_icon_url=sender.icon_url or "",
                content=saved.content,
                timestamp=saved.timestamp
            )
            return response, member_ids
