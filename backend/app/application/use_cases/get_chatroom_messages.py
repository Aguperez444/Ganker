from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.use_cases.chatroom_access import get_chatroom_for_member
from app.infrastructure.api.dto.response.chatroom_response import ChatroomMessageResponse, GetChatroomMessagesResponse

MAX_PAGE_SIZE = 100


class GetChatroomMessages:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, chatroom_id: int, user_id: int, page: int, size: int) -> GetChatroomMessagesResponse:
        with self.uow as uow:
            get_chatroom_for_member(uow, chatroom_id, user_id)

            limit = min(size, MAX_PAGE_SIZE) if size > 0 else 30
            skip = (page - 1) * limit if page >= 1 else 0

            messages = uow.message_repo.get_by_conversation_id(chatroom_id, skip, limit)

            return GetChatroomMessagesResponse(messages=[
                ChatroomMessageResponse(
                    message_id=message.message_id,
                    chatroom_id=message.conversation_id,
                    sender_id=message.sender.user_id,
                    sender_username=message.sender.username,
                    sender_name=message.sender.name,
                    sender_icon_url=message.sender.icon_url or "",
                    content=message.content,
                    timestamp=message.timestamp
                ) for message in messages
            ])
