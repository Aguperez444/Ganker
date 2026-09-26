from pydantic import BaseModel


class DeleteCharacterResponse(BaseModel):
    message: str
