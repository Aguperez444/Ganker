from pydantic import BaseModel

class RefreshTokenRequest(BaseModel):
    refresh_token: str
    force_token: str|None = None

