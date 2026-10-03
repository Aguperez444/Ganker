from app.domain.models.chatroom import Chatroom
from app.infrastructure.database.models.chatroom_orm import ChatroomORM
from app.infrastructure.database.mappers.chatroom_member_mapper import ChatroomMemberMapper

class ChatroomMapper:

    @staticmethod
    def orm_to_domain(chatroom_orm: ChatroomORM) -> Chatroom:
        return Chatroom(
            chatroom_id = chatroom_orm.chatroom_id,
            name = chatroom_orm.name,
            members = [ChatroomMemberMapper.orm_to_domain(member) for member in chatroom_orm.members] if chatroom_orm.members else []
        )

    @staticmethod
    def domain_to_orm(chatroom: Chatroom) -> ChatroomORM:
        if not chatroom.is_persisted():
            return ChatroomORM(
                name = chatroom.name,
                # Note: relationships usually handled at repository level or cascade
            )
        return ChatroomORM(
            chatroom_id = chatroom.chatroom_id,
            name = chatroom.name,
        )
