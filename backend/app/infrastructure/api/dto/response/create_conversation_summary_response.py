from pydantic import BaseModel


class CreateconversationSummaryResponse(BaseModel):
    conversation_id: int
    player_1_id: int
    player_2_id: int