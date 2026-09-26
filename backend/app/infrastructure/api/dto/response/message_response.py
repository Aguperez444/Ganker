from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.infrastructure.api.dto.response.notification_type_enum import NotificationType


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    type: str = NotificationType.NEW_MESSAGE
    message_id: int
    conversation_id: int
    sender_id: int
    content: str
    timestamp: datetime
    is_read: bool

