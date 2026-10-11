from pydantic import BaseModel, Field


class DeleteCharacterResponse(BaseModel):
    message: str = Field(..., description="Mensaje de confirmación de eliminación del personaje")
