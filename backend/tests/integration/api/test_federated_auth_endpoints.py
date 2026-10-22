from typing import Mapping, Optional
from urllib.parse import parse_qs, urlparse

import pytest

import app.infrastructure.api.controllers.auth_controller as auth_ctrl_module
from app.application.ports.i_federated_auth_provider import IFederatedAuthProvider
from app.domain.exceptions.federated_auth.federated_authorization_failed_exception import (
    FederatedAuthorizationFailedException,
)
from app.domain.models.federated_identity import FederatedAccount, FederatedProvider
from app.infrastructure.database.models.discord_account_link_orm import DiscordAccountLinkORM
from app.infrastructure.database.models.federated_identity_orm import FederatedIdentityORM
from app.infrastructure.database.models.user_orm import UserORM
from app.infrastructure.federated_auth.federated_auth_provider_resolver_impl import FederatedAuthProviderResolverImpl


class FakeFederatedProvider(IFederatedAuthProvider):

    def __init__(self, provider_enum: FederatedProvider, account: FederatedAccount):
        self._provider = provider_enum
        self._account = account

    @property
    def provider(self) -> FederatedProvider:
        return self._provider

    def authorization_url(self, state: str) -> str:
        return f"https://{self._provider.value}.test/authorize?state={state}"

    def exchange_callback(self, code: Optional[str] = None,
                          openid_params: Optional[Mapping[str, str]] = None) -> FederatedAccount:
        if code == "malo":
            raise FederatedAuthorizationFailedException(self._provider.label)
        return self._account


@pytest.fixture
def fake_federated_resolver(monkeypatch):
    providers = {
        FederatedProvider.DISCORD: FakeFederatedProvider(
            FederatedProvider.DISCORD,
            FederatedAccount(
                provider=FederatedProvider.DISCORD,
                provider_user_id="discord-999",
                username="ana_discord",
                display_name="Ana Discord",
                email="ana.nueva@example.com",
                avatar_url="https://cdn.discordapp.com/avatars/999/a.png",
            ),
        ),
        FederatedProvider.GOOGLE: FakeFederatedProvider(
            FederatedProvider.GOOGLE,
            FederatedAccount(
                provider=FederatedProvider.GOOGLE,
                provider_user_id="google-777",
                username="johndoe_g",
                display_name="John Doe",
                email="john.doe@example.com",  # Coincide con seed_player
                avatar_url="https://lh3.googleusercontent.com/a/john",
            ),
        ),
        FederatedProvider.STEAM: FakeFederatedProvider(
            FederatedProvider.STEAM,
            FederatedAccount(
                provider=FederatedProvider.STEAM,
                provider_user_id="76561198000099999",
                username="steam_warrior",
                display_name="Steam Warrior",
                email=None,
                avatar_url="https://avatars.steamstatic.com/warrior.jpg",
            ),
        ),
        FederatedProvider.TWITCH: FakeFederatedProvider(
            FederatedProvider.TWITCH,
            FederatedAccount(
                provider=FederatedProvider.TWITCH,
                provider_user_id="twitch-333",
                username="johndoe",  # Colisiona con username de seed_player
                display_name="Streamer Ana",
                email="streamer.ana@example.com",
                avatar_url="https://static-cdn.jtvnw.net/ana.png",
            ),
        ),
    }
    resolver = FederatedAuthProviderResolverImpl(providers)
    monkeypatch.setattr(auth_ctrl_module, "get_federated_provider_resolver", lambda: resolver)
    return providers


def _get_state(client, provider: str) -> str:
    res = client.get(f"/auth/v1/oauth/{provider}/authorize")
    assert res.status_code == 200
    url = urlparse(res.json()["authorization_url"])
    return parse_qs(url.query)["state"][0]


def _callback_payload(provider: str, state: str) -> dict:
    if provider == "steam":
        return {"state": state, "openid_params": {"openid.mode": "id_res"}}
    return {"code": "bueno", "state": state}


class TestFederatedAuthEndpoints:

    def test_new_user_needs_registration_then_completes_and_links_discord(
        self, client, fake_federated_resolver, test_db_session
    ):
        state = _get_state(client, "discord")

        callback_res = client.post("/auth/v1/oauth/discord/callback", json={"code": "bueno", "state": state})
        assert callback_res.status_code == 200
        data = callback_res.json()
        assert data["status"] == "needs_registration"
        assert data["suggested_username"] == "ana_discord"
        assert data["suggested_name"] == "Ana Discord"
        assert data["email"] == "ana.nueva@example.com"
        assert data["registration_token"]

        complete_res = client.post("/auth/v1/oauth/complete-registration", json={
            "registration_token": data["registration_token"],
            "username": "ana_elegido",
            "name": "Ana Jugadora",
        })
        assert complete_res.status_code == 201
        tokens = complete_res.json()
        assert tokens["access_token"]
        assert tokens["refresh_token"]

        # Verificar que el usuario fue creado, su identidad federada guardada y el Discord vinculado al perfil
        me_res = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
        assert me_res.status_code == 200
        assert me_res.json()["username"] == "ana_elegido"
        assert me_res.json()["mail"] == "ana.nueva@example.com"

        discord_res = client.get("/api/v1/users/me/discord", headers={"Authorization": f"Bearer {tokens['access_token']}"})
        assert discord_res.status_code == 200
        assert discord_res.json()["linked"] is True
        assert discord_res.json()["username"] == "ana_discord"

        # Iniciar sesión por segunda vez con el mismo Discord entra directo sin pedir registro
        state2 = _get_state(client, "discord")
        second_login = client.post("/auth/v1/oauth/discord/callback", json={"code": "bueno", "state": state2})
        assert second_login.status_code == 200
        assert second_login.json()["status"] == "authenticated"
        assert second_login.json()["access_token"]

    def test_existing_email_automatically_links_and_logs_in(
        self, client, seed_player, fake_federated_resolver, test_db_session
    ):
        state = _get_state(client, "google")

        callback_res = client.post("/auth/v1/oauth/google/callback", json={"code": "bueno", "state": state})
        assert callback_res.status_code == 200
        data = callback_res.json()
        assert data["status"] == "authenticated"
        assert data["access_token"]

        stored_identity = test_db_session.query(FederatedIdentityORM).filter_by(
            user_id=seed_player.user_id, provider="google"
        ).one()
        assert stored_identity.provider_user_id == "google-777"

    def test_existing_discord_profile_link_is_recognized_for_login(
        self, client, seed_player, fake_federated_resolver, test_db_session
    ):
        # El jugador ya tenía vinculado el Discord "discord-999" en su perfil general
        test_db_session.add(DiscordAccountLinkORM(
            user_id=seed_player.user_id,
            discord_user_id="discord-999",
            username="ana_discord",
            global_name="Ana Discord",
            visibility="teammates",
        ))
        test_db_session.commit()

        state = _get_state(client, "discord")
        callback_res = client.post("/auth/v1/oauth/discord/callback", json={"code": "bueno", "state": state})
        assert callback_res.status_code == 200
        data = callback_res.json()
        assert data["status"] == "authenticated"
        assert data["access_token"]

    def test_steam_registration_without_email_and_username_collision_suggestion(
        self, client, seed_player, fake_federated_resolver, test_db_session
    ):
        # Twitch tiene username "johndoe" que ya usa seed_player -> sugiere "johndoe_1"
        state_twitch = _get_state(client, "twitch")
        twitch_cb = client.post("/auth/v1/oauth/twitch/callback", json={"code": "bueno", "state": state_twitch})
        assert twitch_cb.status_code == 200
        assert twitch_cb.json()["suggested_username"] == "johndoe_1"

        # Steam sin email
        state_steam = _get_state(client, "steam")
        steam_cb = client.post("/auth/v1/oauth/steam/callback", json={
            "state": state_steam,
            "openid_params": {"openid.mode": "id_res"},
        })
        assert steam_cb.status_code == 200
        steam_data = steam_cb.json()
        assert steam_data["status"] == "needs_registration"
        assert steam_data["email"] is None

        # Si intenta usar un username ocupado recibe 409
        dup_res = client.post("/auth/v1/oauth/complete-registration", json={
            "registration_token": steam_data["registration_token"],
            "username": "johndoe",
            "name": "Steam Warrior",
        })
        assert dup_res.status_code == 409

        # Con username libre se registra sin email ni contraseña
        ok_res = client.post("/auth/v1/oauth/complete-registration", json={
            "registration_token": steam_data["registration_token"],
            "username": "steam_warrior",
            "name": "Steam Warrior",
        })
        assert ok_res.status_code == 201
        created_user = test_db_session.query(UserORM).filter_by(username="steam_warrior").one()
        assert created_user.mail is None
        assert created_user.password_hash is None

    @pytest.mark.parametrize(
        "provider,expected_username,expected_name,expected_email",
        [
            ("google", "johndoe_g", "John Doe", "john.doe@example.com"),
            ("discord", "ana_discord", "Ana Discord", "ana.nueva@example.com"),
            ("steam", "steam_warrior", "Steam Warrior", None),
            ("twitch", "johndoe", "Streamer Ana", "streamer.ana@example.com"),
        ],
    )
    def test_re_register_and_login_after_soft_delete_via_delete_me_endpoint_for_all_providers(
        self,
        client,
        fake_federated_resolver,
        test_db_session,
        provider: str,
        expected_username: str,
        expected_name: str,
        expected_email: Optional[str],
    ):
        # 1. Registro inicial con el proveedor federado
        state1 = _get_state(client, provider)
        cb1 = client.post(f"/auth/v1/oauth/{provider}/callback", json=_callback_payload(provider, state1))
        assert cb1.status_code == 200
        cb1_data = cb1.json()
        assert cb1_data["status"] == "needs_registration"

        reg1 = client.post("/auth/v1/oauth/complete-registration", json={
            "registration_token": cb1_data["registration_token"],
            "username": expected_username,
            "name": expected_name,
        })
        assert reg1.status_code == 201
        first_tokens = reg1.json()
        first_headers = {"Authorization": f"Bearer {first_tokens['access_token']}"}

        me1 = client.get("/api/v1/users/me", headers=first_headers)
        assert me1.status_code == 200

        # 2. Borrado lógico de la cuenta mediante DELETE /api/v1/users/me
        del_res = client.delete("/api/v1/users/me", headers=first_headers)
        assert del_res.status_code == 200

        # Verificar que el usuario anterior quedó borrado lógicamente
        test_db_session.expire_all()
        deleted_users = test_db_session.query(UserORM).filter_by(username=expected_username, deleted=True).all()
        assert len(deleted_users) == 1
        old_user_id = deleted_users[0].user_id

        # 3. Intentar autenticarse nuevamente con el mismo proveedor: debe pedir registro limpio
        state2 = _get_state(client, provider)
        cb2 = client.post(f"/auth/v1/oauth/{provider}/callback", json=_callback_payload(provider, state2))
        assert cb2.status_code == 200
        cb2_data = cb2.json()
        assert cb2_data["status"] == "needs_registration"
        assert cb2_data["suggested_username"] == expected_username
        assert cb2_data["email"] == expected_email

        # 4. Completar el nuevo registro reutilizando el mismo username, email e identidad federada
        reg2 = client.post("/auth/v1/oauth/complete-registration", json={
            "registration_token": cb2_data["registration_token"],
            "username": expected_username,
            "name": expected_name,
        })
        assert reg2.status_code == 201
        second_tokens = reg2.json()
        second_headers = {"Authorization": f"Bearer {second_tokens['access_token']}"}

        me2 = client.get("/api/v1/users/me", headers=second_headers)
        assert me2.status_code == 200
        assert me2.json()["username"] == expected_username
        assert me2.json()["mail"] == expected_email

        test_db_session.expire_all()
        active_user = test_db_session.query(UserORM).filter_by(username=expected_username, deleted=False).one()
        assert active_user.user_id != old_user_id

        # 5. Iniciar sesión subsecuente con el mismo proveedor entra directo como 'authenticated'
        state3 = _get_state(client, provider)
        cb3 = client.post(f"/auth/v1/oauth/{provider}/callback", json=_callback_payload(provider, state3))
        assert cb3.status_code == 200
        assert cb3.json()["status"] == "authenticated"
        assert cb3.json()["access_token"]

    @pytest.mark.parametrize(
        "provider,provider_user_id,username,email",
        [
            ("google", "google-777", "johndoe_g", "john.doe@example.com"),
            ("discord", "discord-999", "ana_discord", "ana.nueva@example.com"),
            ("steam", "76561198000099999", "steam_warrior", None),
            ("twitch", "twitch-333", "johndoe", "streamer.ana@example.com"),
        ],
    )
    def test_re_register_when_soft_deleted_user_still_has_stale_federated_records_in_db(
        self,
        client,
        fake_federated_resolver,
        test_db_session,
        provider: str,
        provider_user_id: str,
        username: str,
        email: Optional[str],
    ):
        # Simular una cuenta borrada lógicamente directamente en la BD cuyos vínculos federados
        # aún permanecían persistidos (escenario previo al fix de DeleteUserUseCase).
        soft_deleted_user = UserORM(
            name="Old Deleted User",
            username=username,
            mail=email,
            password_hash=None,
            role="player",
            deleted=True,
        )
        test_db_session.add(soft_deleted_user)
        test_db_session.flush()

        test_db_session.add(
            FederatedIdentityORM(
                user_id=soft_deleted_user.user_id,
                provider=provider,
                provider_user_id=provider_user_id,
                email=email,
            )
        )
        if provider == "discord":
            test_db_session.add(
                DiscordAccountLinkORM(
                    user_id=soft_deleted_user.user_id,
                    discord_user_id=provider_user_id,
                    username=username,
                    global_name="Ana Discord",
                    visibility="teammates",
                )
            )
        test_db_session.commit()

        # El callback no debe autenticar al usuario borrado sino solicitar registro nuevo
        state = _get_state(client, provider)
        cb_res = client.post(f"/auth/v1/oauth/{provider}/callback", json=_callback_payload(provider, state))
        assert cb_res.status_code == 200
        cb_data = cb_res.json()
        assert cb_data["status"] == "needs_registration"
        assert cb_data["suggested_username"] == username

        # Completar registro debe reemplazar limpiamente el vínculo obsoleto sin chocar con restricciones UNIQUE
        complete_res = client.post("/auth/v1/oauth/complete-registration", json={
            "registration_token": cb_data["registration_token"],
            "username": username,
            "name": "Reborn Player",
        })
        assert complete_res.status_code == 201
        tokens = complete_res.json()
        assert tokens["access_token"]

        test_db_session.expire_all()
        active_user = test_db_session.query(UserORM).filter_by(username=username, deleted=False).one()
        assert active_user.user_id != soft_deleted_user.user_id

        linked_identity = test_db_session.query(FederatedIdentityORM).filter_by(
            provider=provider, provider_user_id=provider_user_id
        ).one()
        assert linked_identity.user_id == active_user.user_id

    @pytest.mark.parametrize("provider", ["google", "discord", "twitch"])
    def test_auto_link_by_email_to_new_active_account_after_previous_account_was_soft_deleted(
        self,
        client,
        fake_federated_resolver,
        test_db_session,
        password_hasher,
        provider: str,
    ):
        # El usuario tenía una cuenta con el proveedor federado y la borró lógicamente
        account = fake_federated_resolver[FederatedProvider(provider)]._account
        old_deleted_user = UserORM(
            name="Old User",
            username="old_nick",
            mail=account.email,
            password_hash=None,
            role="player",
            deleted=True,
        )
        test_db_session.add(old_deleted_user)
        test_db_session.flush()
        test_db_session.add(
            FederatedIdentityORM(
                user_id=old_deleted_user.user_id,
                provider=provider,
                provider_user_id=account.provider_user_id,
                email=account.email,
            )
        )
        if provider == "discord":
            test_db_session.add(
                DiscordAccountLinkORM(
                    user_id=old_deleted_user.user_id,
                    discord_user_id=account.provider_user_id,
                    username=account.username,
                    global_name=account.display_name,
                    visibility="teammates",
                )
            )

        # Luego registró una nueva cuenta activa con el mismo correo electrónico
        new_active_user = UserORM(
            name="New Active User",
            username="new_active_nick",
            mail=account.email,
            password_hash=password_hasher.hash_password("Password123"),
            role="player",
            deleted=False,
        )
        test_db_session.add(new_active_user)
        test_db_session.commit()

        # Al iniciar sesión con el proveedor federado, debe vincularse a la nueva cuenta activa e iniciar sesión
        state = _get_state(client, provider)
        cb_res = client.post(f"/auth/v1/oauth/{provider}/callback", json=_callback_payload(provider, state))
        assert cb_res.status_code == 200
        cb_data = cb_res.json()
        assert cb_data["status"] == "authenticated"
        assert cb_data["access_token"]

        test_db_session.expire_all()
        identity = test_db_session.query(FederatedIdentityORM).filter_by(
            provider=provider, provider_user_id=account.provider_user_id
        ).one()
        assert identity.user_id == new_active_user.user_id
