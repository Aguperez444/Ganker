from unittest.mock import AsyncMock, MagicMock
import pytest

from app.application.use_cases.create_rank import CreateRank
from app.application.ports.i_storage_service import IStorageService
from app.domain.models.videogame import Videogame
from app.domain.models.rank import Rank
from app.domain.exceptions.rank.invalid_rank_name_exception import InvalidRankNameException
from app.domain.exceptions.rank.invalid_rank_value_exception import InvalidRankValueException
from app.domain.exceptions.rank.duplicated_rank_name_exception import DuplicatedRankNameException
from app.domain.exceptions.rank.duplicated_rank_value_exception import DuplicatedRankValueException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException


class TestCreateRankUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.videogame_repo = MagicMock()
        uow.rank_repo = MagicMock()

        storage_service = MagicMock(spec=IStorageService)
        storage_service.save_file = AsyncMock(return_value="/media/league_of_legends/ranks/gold.png")
        storage_service.delete_file = AsyncMock(return_value=True)

        use_case = CreateRank(storage_service=storage_service, uow=uow)
        return use_case, uow, storage_service

    @pytest.mark.anyio
    async def test_create_rank_happy_path(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="League of Legends", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.rank_repo.get_ranks_by_game_id.return_value = []

        saved = Rank(rank_id=1, name="Gold", value=1000, videogame=vg, icon_url="/media/league_of_legends/ranks/gold.png")
        uow.rank_repo.save_rank.return_value = saved

        result = await use_case.execute(game_id=1, name="Gold", icon_stream=MagicMock(), filename="gold.png", value=1000)

        assert result.rank_id == 1
        assert result.name == "Gold"
        assert result.value == 1000
        assert result.icon_url == "/media/league_of_legends/ranks/gold.png"

        storage_service.save_file.assert_called_once()
        uow.rank_repo.save_rank.assert_called_once()

    @pytest.mark.anyio
    async def test_create_rank_empty_name(self, mock_deps):
        use_case, _, _ = mock_deps

        with pytest.raises(InvalidRankNameException) as exc_info:
            await use_case.execute(game_id=1, name="  ", icon_stream=MagicMock(), filename="gold.png", value=1000)

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_create_rank_negative_value(self, mock_deps):
        use_case, _, _ = mock_deps

        with pytest.raises(InvalidRankValueException) as exc_info:
            await use_case.execute(game_id=1, name="Gold", icon_stream=MagicMock(), filename="gold.png", value=-50)

        assert exc_info.value.status_code == 400

    @pytest.mark.anyio
    async def test_create_rank_game_not_found(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.videogame_repo.get_videogame_by_id.return_value = None

        with pytest.raises(VideogameNotFoundException) as exc_info:
            await use_case.execute(game_id=999, name="Gold", icon_stream=MagicMock(), filename="gold.png", value=1000)

        assert exc_info.value.status_code == 404

    @pytest.mark.anyio
    async def test_create_rank_duplicate_name(self, mock_deps):
        use_case, uow, _ = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        existing = Rank(rank_id=1, name="Gold", value=1000, videogame=vg, icon_url="/gold.png")
        uow.rank_repo.get_ranks_by_game_id.return_value = [existing]

        with pytest.raises(DuplicatedRankNameException) as exc_info:
            await use_case.execute(game_id=1, name="Gold", icon_stream=MagicMock(), filename="gold.png", value=2000)

        assert exc_info.value.status_code == 409

    @pytest.mark.anyio
    async def test_create_rank_duplicate_value(self, mock_deps):
        use_case, uow, _ = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        existing = Rank(rank_id=1, name="Gold", value=1000, videogame=vg, icon_url="/gold.png")
        uow.rank_repo.get_ranks_by_game_id.return_value = [existing]

        with pytest.raises(DuplicatedRankValueException) as exc_info:
            await use_case.execute(game_id=1, name="Silver", icon_stream=MagicMock(), filename="silver.png", value=1000)

        assert exc_info.value.status_code == 409

    @pytest.mark.anyio
    async def test_create_rank_db_error_cleans_up_file(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="League of Legends", icon_url="/icon.png")
        uow.videogame_repo.get_videogame_by_id.return_value = vg
        uow.rank_repo.get_ranks_by_game_id.return_value = []
        uow.rank_repo.save_rank.side_effect = RuntimeError("DB error")

        with pytest.raises(RuntimeError):
            await use_case.execute(game_id=1, name="Gold", icon_stream=MagicMock(), filename="gold.png", value=1000)

        storage_service.delete_file.assert_called_once_with("/media/league_of_legends/ranks/gold.png")
