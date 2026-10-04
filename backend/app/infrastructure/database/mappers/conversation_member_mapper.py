from app.domain.models.conversation_member import ConversationMember
from app.infrastructure.database.models.conversation_member_orm import ConversationMemberORM
from app.infrastructure.database.mappers.user_mapper import UserMapper
from app.domain.models.conversation_member_role_enum import ConversationMemberRoleEnum

class ConversationMemberMapper:

    @staticmethod
    def orm_to_domain(member_orm: ConversationMemberORM) -> ConversationMember:
        return ConversationMember(
            conversation_member_id=member_orm.conversation_member_id,
            conversation_id=member_orm.conversation_id,
            user=UserMapper.orm_to_domain(member_orm.user),
            role=ConversationMemberRoleEnum(member_orm.role) if member_orm.role else None
        )

    @staticmethod
    def domain_to_orm(member: ConversationMember) -> ConversationMemberORM:
        if not member.is_persisted():
            return ConversationMemberORM(
                user_id=member.user.user_id,
                role=member.role.value if member.role is not None else None
            )
        return ConversationMemberORM(
            conversation_member_id=member.conversation_member_id,
            conversation_id=member.conversation_id,
            user_id=member.user.user_id,
            role=member.role.value if member.role else None
        )
