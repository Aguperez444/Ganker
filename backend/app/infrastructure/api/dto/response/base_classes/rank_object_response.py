from pydantic import BaseModel, Field

class RankObjectResponse(BaseModel):
    rank_id: int = Field(..., description="ID único del rango")
    name: str = Field(..., description="Nombre del rango")
    value: int = Field(..., description="Valor numérico del rango")
    icon_url: str = Field(..., description="URL del ícono del rango")
