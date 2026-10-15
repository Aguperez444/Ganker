import io
from unittest.mock import MagicMock
import pytest

from app.application.use_cases.sync_characters_from_catalog import SyncCharactersFromCatalog
from app.application.use_cases.query_character_sync_support import QueryCharacterSyncSupport
from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_character_catalog_provider import ICharacterCatalogProvider
from app.application.ports.i_character_catalog_provider_resolver import ICharacterCatalogProviderResolver
from app.domain.models.videogame import Videogame
from app.domain.models.character import Character
from app.infrastructure.api.dto.request.catalog_character import CatalogCharacter
from app.domain.exceptions.character.character_sync_not_supported_exception import CharacterSyncNotSupportedException
from app.domain.exceptions.character.external_catalog_unavailable_exception import ExternalCatalogUnavailableException
from app.domain.exceptions.file.invalid_file_content_error import InvalidFileContentError
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException


LOL = Videogame(videogame_id=1, name="League of Legends", icon_url="/lol.png", rank_per_role=False)


def _saved_character(character: Character) -> Character:
    return Character(character_id=100, name=character.name, videogame=character.videogame, icon_url=character.icon_url)


class TestSyncCharactersFromCatalogUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.videogame_repo.get_videogame_by_id.return_value = LOL
        uow.character_repo.get_character_by_name_and_videogame.return_value = None
        uow.character_repo.create_character.side_effect = _saved_character

        provider = MagicMock(spec=ICharacterCatalogProvider)
        provider.source_name = "Riot Games (Data Dragon)"
        provider.fetch_characters.return_value = [
            CatalogCharacter(name="Ahri", icon_source="https://cdn/ahri.png"),
            CatalogCharacter(name="Wukong", icon_source="https://cdn/MonkeyKing.png"),
        ]
        provider.download_icon.side_effect = lambda c: (io.BytesIO(b"img"), f"{c.name}.png")

        resolver = MagicMock(spec=ICharacterCatalogProviderResolver)
        resolver.get_provider_for.return_value = provider

        storage_service = MagicMock(spec=IStorageService)
        storage_service.save_image_file.side_effect = (
            lambda file_content, filename, subfolder, preserve_original_name: f"/media/{subfolder}/{filename.lower()}"
        )

        use_case = SyncCharactersFromCatalog(resolver, storage_service, uow)
        return use_case, uow, provider, resolver, storage_service

    def test_sync_creates_all_new_characters(self, mock_deps):
        use_case, uow, _, _, storage_service = mock_deps

        result = use_case.execute(videogame_id=1)

        assert result.source == "Riot Games (Data Dragon)"
        assert [c.name for c in result.created] == ["Ahri", "Wukong"]
        assert result.created[1].icon_url == "/media/games/league_of_legends/characters/wukong.png"
        assert result.skipped_count == 0
        assert result.failed == []
        assert uow.character_repo.create_character.call_count == 2
        storage_service.save_image_file.assert_called_with(
            file_content=storage_service.save_image_file.call_args.kwargs["file_content"],
            filename="Wukong.png",
            subfolder="games/league_of_legends/characters",
            preserve_original_name=True
        )

    def test_sync_skips_existing_characters_without_downloading_them(self, mock_deps):
        use_case, uow, provider, _, _ = mock_deps
        existing = Character(character_id=5, name="Ahri", videogame=LOL, icon_url="/media/ahri.png")
        uow.character_repo.get_character_by_name_and_videogame.side_effect = (
            lambda name, videogame_id: existing if name == "Ahri" else None
        )

        result = use_case.execute(videogame_id=1)

        assert [c.name for c in result.created] == ["Wukong"]
        assert result.skipped_count == 1
        provider.download_icon.assert_called_once()
        uow.character_repo.update_character.assert_not_called()
        uow.character_repo.delete_character.assert_not_called()

    def test_sync_continues_when_one_icon_fails(self, mock_deps):
        use_case, _, provider, _, _ = mock_deps

        def download(character):
            if character.name == "Ahri":
                raise ExternalCatalogUnavailableException("Riot Games (Data Dragon)")
            return io.BytesIO(b"img"), f"{character.name}.png"
        provider.download_icon.side_effect = download

        result = use_case.execute(videogame_id=1)

        assert result.failed == ["Ahri"]
        assert [c.name for c in result.created] == ["Wukong"]

    def test_sync_reports_icon_with_invalid_content_as_failed(self, mock_deps):
        use_case, _, _, _, storage_service = mock_deps
        storage_service.save_image_file.side_effect = InvalidFileContentError()

        result = use_case.execute(videogame_id=1)

        assert result.created == []
        assert result.failed == ["Ahri", "Wukong"]

    def test_sync_ignores_catalog_entries_without_name(self, mock_deps):
        use_case, uow, provider, _, _ = mock_deps
        provider.fetch_characters.return_value = [CatalogCharacter(name="   ", icon_source="https://cdn/x.png")]

        result = use_case.execute(videogame_id=1)

        assert result.created == []
        assert result.failed == []
        uow.character_repo.create_character.assert_not_called()

    def test_sync_videogame_not_found(self, mock_deps):
        use_case, uow, provider, _, _ = mock_deps
        uow.videogame_repo.get_videogame_by_id.return_value = None

        with pytest.raises(VideogameNotFoundException) as exc_info:
            use_case.execute(videogame_id=999)

        assert exc_info.value.status_code == 404
        provider.fetch_characters.assert_not_called()

    def test_sync_videogame_without_provider_is_not_supported(self, mock_deps):
        use_case, _, _, resolver, _ = mock_deps
        resolver.get_provider_for.return_value = None

        with pytest.raises(CharacterSyncNotSupportedException) as exc_info:
            use_case.execute(videogame_id=1)

        assert exc_info.value.status_code == 400

    def test_sync_videogame_without_characters_is_not_supported(self, mock_deps):
        use_case, uow, provider, _, _ = mock_deps
        uow.videogame_repo.get_videogame_by_id.return_value = Videogame(
            videogame_id=1, name="League of Legends", icon_url="/lol.png", rank_per_role=False, has_characters=False
        )

        with pytest.raises(CharacterSyncNotSupportedException):
            use_case.execute(videogame_id=1)

        provider.fetch_characters.assert_not_called()

    def test_sync_catalog_unavailable_propagates(self, mock_deps):
        use_case, uow, provider, _, _ = mock_deps
        provider.fetch_characters.side_effect = ExternalCatalogUnavailableException("Riot Games (Data Dragon)")

        with pytest.raises(ExternalCatalogUnavailableException) as exc_info:
            use_case.execute(videogame_id=1)

        assert exc_info.value.status_code == 502
        uow.character_repo.create_character.assert_not_called()

    def test_sync_database_error_deletes_saved_icons(self, mock_deps):
        use_case, uow, _, _, storage_service = mock_deps
        uow.character_repo.create_character.side_effect = [
            Character(character_id=1, name="Ahri", videogame=LOL, icon_url="/media/ahri.png"),
            RuntimeError("DB caída"),
        ]

        with pytest.raises(RuntimeError):
            use_case.execute(videogame_id=1)

        deleted = [call.args[0] for call in storage_service.delete_file.call_args_list]
        assert deleted == [
            "/media/games/league_of_legends/characters/ahri.png",
            "/media/games/league_of_legends/characters/wukong.png",
        ]


class TestQueryCharacterSyncSupportUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.videogame_repo.get_videogame_by_id.return_value = LOL

        provider = MagicMock(spec=ICharacterCatalogProvider)
        provider.source_name = "Riot Games (Data Dragon)"
        resolver = MagicMock(spec=ICharacterCatalogProviderResolver)
        resolver.get_provider_for.return_value = provider

        return QueryCharacterSyncSupport(resolver, uow), uow, resolver

    def test_supported_game_returns_source(self, mock_deps):
        use_case, _, _ = mock_deps

        result = use_case.execute(videogame_id=1)

        assert result.supported is True
        assert result.source == "Riot Games (Data Dragon)"

    def test_game_without_provider_is_manual(self, mock_deps):
        use_case, _, resolver = mock_deps
        resolver.get_provider_for.return_value = None

        result = use_case.execute(videogame_id=1)

        assert result.supported is False
        assert result.source is None

    def test_game_without_characters_is_not_supported(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.videogame_repo.get_videogame_by_id.return_value = Videogame(
            videogame_id=1, name="League of Legends", icon_url="/lol.png", rank_per_role=False, has_characters=False
        )

        assert use_case.execute(videogame_id=1).supported is False

    def test_videogame_not_found(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.videogame_repo.get_videogame_by_id.return_value = None

        with pytest.raises(VideogameNotFoundException):
            use_case.execute(videogame_id=999)
