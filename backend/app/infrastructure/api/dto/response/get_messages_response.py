from pydantic import BaseModel, Field

from app.infrastructure.api.dto.response.base_classes.message_object_response import MessageObjectResponse


class GetMessagesResponse(BaseModel):
    messages : list[MessageObjectResponse] = Field(..., description="Lista de mensajes de la conversación")