from pydantic import BaseModel

class RegisterVideogameResponse(BaseModel):
    videogame_id: int
    name: str