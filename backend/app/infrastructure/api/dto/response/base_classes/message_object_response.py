from pydantic import BaseModel, Field
from datetime import datetime

class MessageObjectResponse(BaseModel):
    message_id: int = Field(description="ID del mensaje")
    content: str = Field(description="Contenido del mensaje")
    sender_id: int = Field(description="ID del remitente del mensaje")
    conversation_id: int = Field(description="ID de la conversación a la que pertenece el mensaje")
    timestamp: datetime = Field(description="Marca de tiempo del mensaje")
    is_read: bool = Field(description="Indica si el mensaje ha sido leído o no")