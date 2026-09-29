from pydantic import BaseModel, Field, ConfigDict

from app.infrastructure.api.dto.response.notification.notification_type_enum import NotificationType


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    type: NotificationType = Field(..., description="Tipo de notificación")
    conversation_id: int = Field(..., description="ID de la conversación asociada a la notificación")
    sender_id: int = Field(..., description="ID del remitente de la notificación")
    content: str = Field(..., description="Contenido del mensaje que generó la notificación")
    timestamp: str = Field(..., description="Marca de tiempo de la notificación")
