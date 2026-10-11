from datetime import datetime
from pydantic import BaseModel, Field


class ParticipantSummaryResponse(BaseModel):
    user_id: int = Field(..., description="ID único del participante")
    username: str = Field(..., description="Nombre de usuario del participante")
    name: str = Field(..., description="Nombre completo del participante")
    icon_url: str = Field(..., description="URL del ícono del participante")

class LastMessageResponse(BaseModel):
    content: str = Field(..., description="Contenido del último mensaje")
    timestamp: datetime = Field(..., description="Marca de tiempo del último mensaje")
    sender_id: int = Field(..., description="ID del remitente del último mensaje")
    is_read: bool = Field(..., description="Indica si el último mensaje fue leído")

class ConversationSummaryItemResponse(BaseModel):
    conversation_id: int = Field(..., description="ID único de la conversación")
    other_participant: ParticipantSummaryResponse = Field(..., description="Datos del otro participante de la conversación")
    last_message: LastMessageResponse | None = Field(None, description="Último mensaje de la conversación, o null si no hay mensajes")
    unread_count: int = Field(..., description="Cantidad de mensajes no leídos en la conversación")

class ConversationSummaryResponse(BaseModel):
    conversations: list[ConversationSummaryItemResponse] = Field(..., description="Lista de conversaciones del usuario")
