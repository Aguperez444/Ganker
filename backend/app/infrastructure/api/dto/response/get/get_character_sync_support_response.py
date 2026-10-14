from typing import Optional

from pydantic import BaseModel, Field


class GetCharacterSyncSupportResponse(BaseModel):
    supported: bool = Field(..., description="Indica si los personajes del videojuego se pueden importar automáticamente")
    source: Optional[str] = Field(None, description="Fuente externa desde la que se importan, si la hay")
