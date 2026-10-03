from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.infrastructure.api.dto.response.notification.notification_type_enum import NotificationType


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    type: str = Field(NotificationType.NEW_MESSAGE, description="Tipo de notificación del mensaje")
    message_id: int = Field(..., description="ID único del mensaje")
    conversation_id: int = Field(..., description="ID de la conversación a la que pertenece el mensaje")
    sender_id: int = Field(..., description="ID del remitente del mensaje")
    content: str = Field(..., description="Contenido del mensaje")
    timestamp: datetime = Field(..., description="Marca de tiempo del mensaje")
    is_read: bool = Field(..., description="Indica si el mensaje ha sido leído")
