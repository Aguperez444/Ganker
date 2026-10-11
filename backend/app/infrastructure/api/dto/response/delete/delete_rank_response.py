from pydantic import BaseModel, Field


class DeleteRankResponse(BaseModel):
    message: str = Field(..., description="Mensaje de confirmación de eliminación del rango")
