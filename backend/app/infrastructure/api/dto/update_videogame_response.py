from pydantic import BaseModel, Field

class UpdateVideogameResponse(BaseModel):
    videogame_id: int
    name: str