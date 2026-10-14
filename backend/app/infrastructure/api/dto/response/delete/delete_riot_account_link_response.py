from pydantic import BaseModel, Field


class DeleteRiotAccountLinkResponse(BaseModel):
    message: str = Field(..., description="Mensaje de confirmación de la desvinculación de la cuenta de Riot")
