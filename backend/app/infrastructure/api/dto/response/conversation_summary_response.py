from datetime import datetime
from pydantic import BaseModel

class ParticipantSummaryResponse(BaseModel):
    user_id: int
    username: str
    name: str
    icon_url: str

class LastMessageResponse(BaseModel):
    content: str
    timestamp: datetime
    sender_id: int
    is_read: bool

class ConversationSummaryItemResponse(BaseModel):
    conversation_id: int
    other_participant: ParticipantSummaryResponse
    last_message: LastMessageResponse | None = None
    unread_count: int

class ConversationSummaryResponse(BaseModel):
    conversations: list[ConversationSummaryItemResponse]