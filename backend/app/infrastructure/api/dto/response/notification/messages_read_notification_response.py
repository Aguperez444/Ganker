from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.notification.notification_type_enum import NotificationType


class MessagesReadNotificationResponse(BaseModel):
    type: str = Field(NotificationType.MESSAGES_READ, description="Tipo de notificación de mensajes leídos")
    conversation_id: int = Field(..., description="ID de la conversación cuyos mensajes fueron leídos")
    read_by: int = Field(..., description="ID del usuario que leyó los mensajes")
