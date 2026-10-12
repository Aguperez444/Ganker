from pydantic import BaseModel, Field


class DeleteTeamResponse(BaseModel):
    status: str = Field("success", description="Resultado de la operación")
    message: str = Field("El equipo fue disuelto exitosamente.", description="Confirmación indicando que el equipo fue disuelto exitosamente")
