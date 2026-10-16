from app.application.ports.i_federated_auth_provider import IFederatedAuthProviderResolver
from app.application.ports.i_federated_state_service import IFederatedStateService
from app.infrastructure.api.dto.response.federated_auth_response import FederatedAuthorizationUrlResponse


class GetFederatedAuthorizationUrl:
    """Primer paso del inicio de sesión o registro federado: genera el state firmado y arma la URL del proveedor."""

    def __init__(self, provider_resolver: IFederatedAuthProviderResolver, state_service: IFederatedStateService):
        self.provider_resolver: IFederatedAuthProviderResolver = provider_resolver
        self.state_service: IFederatedStateService = state_service

    def execute(self, provider_name: str) -> FederatedAuthorizationUrlResponse:
        provider_adapter = self.provider_resolver.resolve(provider_name)
        state = self.state_service.create_state(provider_adapter.provider)
        return FederatedAuthorizationUrlResponse(
            authorization_url=provider_adapter.authorization_url(state),
            provider=provider_adapter.provider.value,
        )
