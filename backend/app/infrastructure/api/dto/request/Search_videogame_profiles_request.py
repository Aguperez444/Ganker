from typing import List, Optional

from pydantic import BaseModel, Field


class SearchVideogameProfilesRequest(BaseModel):
    videogame_id: int
    characters: Optional[List[int]] = None
    roles: Optional[List[int]] = None
    ranks: Optional[List[int]] = None
    name: Optional[str] = Field(min_length=4, max_length=50 , default=None)
    page: int | None = None
    page_size: int | None = None
