from typing import List, Optional

from pydantic import BaseModel


class SearchVideogameProfilesRequest(BaseModel):
    videogame_id: int
    # last_connection: str
    characters: Optional[List[int]] = None
    roles: Optional[List[int]] = None
    ranks: Optional[List[int]] = None
    name: Optional[str] = None
    regular_routine: Optional[str] = None
    page: int | None = None
    page_size: int | None = None
