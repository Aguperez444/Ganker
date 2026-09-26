from pydantic import BaseModel, ConfigDict

from app.infrastructure.api.dto.response.notification_type_enum import NotificationType


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    type: NotificationType
    conversation_id: int
    sender_id: int
    content: str
    timestamp: str