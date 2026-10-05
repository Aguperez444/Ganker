from datetime import datetime
from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.notification.notification_type_enum import NotificationType


class ChatroomMessageResponse(BaseModel):
    type: str = Field(NotificationType.NEW_CHATROOM_MESSAGE, description="Tipo de notificación del mensaje")
    message_id: int = Field(..., description="ID único del mensaje")
    chatroom_id: int = Field(..., description="ID del chatroom al que pertenece el mensaje")
    sender_id: int = Field(..., description="ID del remitente del mensaje")
    sender_username: str = Field(..., description="Nombre de usuario del remitente")
    sender_name: str = Field(..., description="Nombre del remitente")
    sender_icon_url: str = Field(..., description="URL del ícono del remitente")
    content: str = Field(..., description="Contenido del mensaje")
    timestamp: datetime = Field(..., description="Marca de tiempo del mensaje")


class GetChatroomMessagesResponse(BaseModel):
    messages: list[ChatroomMessageResponse] = Field(..., description="Lista de mensajes del chatroom")


class ChatroomLastMessageResponse(BaseModel):
    content: str = Field(..., description="Contenido del último mensaje")
    timestamp: datetime = Field(..., description="Marca de tiempo del último mensaje")
    sender_id: int = Field(..., description="ID del remitente del último mensaje")
    sender_username: str = Field(..., description="Nombre de usuario del remitente del último mensaje")


class ChatroomSummaryItemResponse(BaseModel):
    chatroom_id: int = Field(..., description="ID único del chatroom")
    team_id: int | None = Field(None, description="ID del equipo dueño del chatroom")
    name: str | None = Field(None, description="Nombre del chatroom")
    icon_url: str = Field(..., description="Ícono del chatroom (el ícono del equipo)")
    member_count: int = Field(..., description="Cantidad de miembros del chatroom")
    last_message: ChatroomLastMessageResponse | None = Field(None, description="Último mensaje, o null si no hay mensajes")
    unread_count: int = Field(..., description="Cantidad de mensajes no leídos por el usuario")


class ChatroomSummaryResponse(BaseModel):
    chatrooms: list[ChatroomSummaryItemResponse] = Field(..., description="Lista de chatrooms del usuario")
