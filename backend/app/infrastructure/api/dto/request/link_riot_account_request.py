from typing import Optional

from pydantic import BaseModel, Field


class LinkRiotAccountRequest(BaseModel):
    riot_id: str = Field(..., min_length=5, max_length=22, description="Riot ID de la cuenta, con la forma Nombre#TAG")
    server: Optional[str] = Field(None, max_length=10, description="Servidor de League of Legends (ej. 'la2' para LAS). "
                                                                   "En Valorant no se manda: la región la informa Riot")
