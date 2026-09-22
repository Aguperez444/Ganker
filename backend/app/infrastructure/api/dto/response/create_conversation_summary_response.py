from pydantic import BaseModel


class CreateConversationSummaryResponse(BaseModel):
    conversation_id: int
    player_1_id: int
    player_2_id: int