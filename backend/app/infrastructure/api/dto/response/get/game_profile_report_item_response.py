from typing import Optional

from pydantic import BaseModel, Field


class GameProfileReportItemResponse(BaseModel):
    videogame_id: int = Field(..., description="ID del videojuego")
    videogame_name: str = Field(..., description="Nombre del videojuego")
    icon_url: Optional[str] = Field(None, description="URL del ícono del videojuego")
    profile_count: int = Field(..., description="Cantidad total de perfiles de jugador asociados al videojuego")
    percentage: float = Field(..., description="Porcentaje que representa respecto al total general de perfiles")
    variation: Optional[int] = Field(None, description="Variación absoluta de perfiles respecto al último reporte previo")
    variation_percentage: Optional[float] = Field(None, description="Variación porcentual respecto al último reporte previo")
    trend: Optional[str] = Field(None, description="Tendencia respecto al último reporte previo: sube, baja o estable")
