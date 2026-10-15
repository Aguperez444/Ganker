from pydantic import BaseModel, Field


class DeleteDiscordAccountLinkResponse(BaseModel):
    message: str = Field(..., description="Mensaje de confirmación de la desvinculación de Discord")
