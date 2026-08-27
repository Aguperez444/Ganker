from dataclasses import dataclass

@dataclass(frozen=True)
class AuthTokensResponse:
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"