from pydantic import BaseModel

from app.infrastructure.api.dto.response.notification_type_enum import NotificationType


class NotificationResponse(BaseModel):
    type: NotificationType
    conversation_id: int
    sender_id: int
    content: str
    timestamp: str

    class Config:
        from_attributes = True