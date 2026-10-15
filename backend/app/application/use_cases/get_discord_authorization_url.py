from app.application.ports.i_discord_oauth_provider import IDiscordOAuthProvider
from app.application.ports.i_oauth_state_service import IOAuthStateService
from app.infrastructure.api.dto.response.get.get_discord_account_response import DiscordAuthorizationUrlResponse


class GetDiscordAuthorizationUrl:
    """Primer paso de "Conectar con Discord": arma la URL de Discord con un state atado al jugador."""

    def __init__(self, oauth_provider: IDiscordOAuthProvider, state_service: IOAuthStateService):
        self.oauth_provider: IDiscordOAuthProvider = oauth_provider
        self.state_service: IOAuthStateService = state_service

    def execute(self, user_id: int) -> DiscordAuthorizationUrlResponse:
        state = self.state_service.create_state(user_id)
        return DiscordAuthorizationUrlResponse(authorization_url=self.oauth_provider.authorization_url(state))
