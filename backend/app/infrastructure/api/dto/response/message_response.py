from datetime import datetime
from pydantic import BaseModel

class MessageResponse(BaseModel):
    message_id: int
    conversation_id: int
    sender_id: int
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True

