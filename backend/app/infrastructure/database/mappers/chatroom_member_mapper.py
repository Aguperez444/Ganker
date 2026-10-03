from app.domain.models.chatroom_member import ChatroomMember
from app.infrastructure.database.models.chatroom_member_orm import ChatroomMemberORM
from app.infrastructure.database.mappers.user_mapper import UserMapper

class ChatroomMemberMapper:

    @staticmethod
    def orm_to_domain(chatroom_member_orm: ChatroomMemberORM) -> ChatroomMember:
        return ChatroomMember(
            chatroom_member_id = chatroom_member_orm.chatroom_member_id,
            chatroom_id = chatroom_member_orm.chatroom_id,
            user = UserMapper.orm_to_domain(chatroom_member_orm.user) if chatroom_member_orm.user else None
        )

    @staticmethod
    def domain_to_orm(chatroom_member: ChatroomMember) -> ChatroomMemberORM:
        if not chatroom_member.is_persisted():
            return ChatroomMemberORM(
                chatroom_id = chatroom_member.chatroom_id,
                user_id = chatroom_member.user.user_id if chatroom_member.user and chatroom_member.user.is_persisted() else None
            )
        return ChatroomMemberORM(
            chatroom_member_id = chatroom_member.chatroom_member_id,
            chatroom_id = chatroom_member.chatroom_id,
            user_id = chatroom_member.user.user_id if chatroom_member.user and chatroom_member.user.is_persisted() else None
        )
