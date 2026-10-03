from pydantic import BaseModel, Field, field_validator
from app.domain.exceptions.chat.message_is_empty_exception import MessageIsEmptyException

class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="Contenido del mensaje a enviar")

    @field_validator("content")
    @classmethod
    def content_not_whitespace(cls, v: str) -> str:
        if not v or not v.strip():
            raise MessageIsEmptyException()
        return v

