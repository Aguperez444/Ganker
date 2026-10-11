from pydantic import BaseModel, Field


class CreateConversationSummaryResponse(BaseModel):
    conversation_id: int = Field(..., description="ID único de la conversación creada")
    player_1_id: int = Field(..., description="ID del primer participante de la conversación")
    player_2_id: int = Field(..., description="ID del segundo participante de la conversación")
