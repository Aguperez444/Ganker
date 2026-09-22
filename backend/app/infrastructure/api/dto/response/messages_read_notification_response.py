from pydantic import BaseModel

from app.infrastructure.api.dto.response.notification_type_enum import NotificationType


class MessagesReadNotificationResponse(BaseModel):
    type: str = NotificationType.MESSAGES_READ
    conversation_id: int
    read_by: int

