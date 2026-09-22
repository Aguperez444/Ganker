from pydantic import BaseModel, Field

class StartConversationRequest(BaseModel):
    target_user_id: int = Field(..., gt=0)

