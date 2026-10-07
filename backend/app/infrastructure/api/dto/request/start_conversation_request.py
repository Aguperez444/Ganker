from pydantic import BaseModel, Field

class StartConversationRequest(BaseModel):
    target_user_id: int = Field(..., gt=0, description="ID del usuario con quien iniciar la conversación")
