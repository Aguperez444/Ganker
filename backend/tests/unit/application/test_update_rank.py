from unittest.mock import MagicMock
import pytest

from app.application.use_cases.update_rank import UpdateRank
from app.application.ports.i_storage_service import IStorageService
from app.domain.models.videogame import Videogame
from app.domain.models.rank import Rank
from app.domain.exceptions.rank.invalid_rank_name_exception import InvalidRankNameException
from app.domain.exceptions.rank.invalid_rank_value_exception import InvalidRankValueException
from app.domain.exceptions.rank.duplicated_rank_name_exception import DuplicatedRankNameException
from app.domain.exceptions.rank.duplicated_rank_value_exception import DuplicatedRankValueException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException


class TestUpdateRankUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.rank_repo = MagicMock()
        uow.rank_repo.get_rank_by_name_and_videogame.return_value = None
        uow.rank_repo.get_rank_by_value_and_videogame.return_value = None

        storage_service = MagicMock(spec=IStorageService)
        storage_service.save_image_file = MagicMock(return_value="/media/games/league_of_legends/ranks/gold_new.png")
        storage_service.delete_file = MagicMock(return_value=True)

        use_case = UpdateRank(storage_service=storage_service, uow=uow)
        return use_case, uow, storage_service

    def test_update_rank_happy_path_all_fields(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="League of Legends", icon_url="/icon.png", rank_per_role=True)
        existing = Rank(rank_id=1, name="Gold", value=1000, videogame=vg, icon_url="/media/games/league_of_legends/ranks/gold_old.png")
        uow.rank_repo.get_rank_by_id.return_value = existing
        uow.rank_repo.get_ranks_by_game_id.return_value = [existing]
        uow.rank_repo.update_rank.side_effect = lambda r: r

        mock_icon = MagicMock()
        mock_icon.filename = "gold_new.png"
        mock_icon.file = MagicMock()

        result = use_case.execute(rank_id=1, name="Gold Updated", value=1200, icon=mock_icon)

        assert result.rank_id == 1
        assert result.name == "Gold Updated"
        assert result.value == 1200
        assert result.icon_url == "/media/games/league_of_legends/ranks/gold_new.png"

        storage_service.delete_file.assert_called_once_with("/media/games/league_of_legends/ranks/gold_old.png")
        storage_service.save_image_file.assert_called_once()
        uow.rank_repo.update_rank.assert_called_once()

    def test_update_rank_keep_same_name_change_order_no_icon(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="League of Legends", icon_url="/icon.png", rank_per_role=True)
        existing = Rank(rank_id=1, name="Gold", value=1000, videogame=vg, icon_url="/media/games/league_of_legends/ranks/gold.png")
        uow.rank_repo.get_rank_by_id.return_value = existing
        uow.rank_repo.get_ranks_by_game_id.return_value = [existing]
        uow.rank_repo.update_rank.side_effect = lambda r: r

        result = use_case.execute(rank_id=1, name="Gold", value=1500, icon=None)

        assert result.rank_id == 1
        assert result.name == "Gold"
        assert result.value == 1500
        assert result.icon_url == "/media/games/league_of_legends/ranks/gold.png"

        storage_service.delete_file.assert_not_called()
        storage_service.save_image_file.assert_not_called()
        uow.rank_repo.update_rank.assert_called_once()

    def test_update_rank_keep_same_value_change_name_no_icon(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="League of Legends", icon_url="/icon.png", rank_per_role=True)
        existing = Rank(rank_id=1, name="Gold", value=1000, videogame=vg, icon_url="/media/games/league_of_legends/ranks/gold.png")
        uow.rank_repo.get_rank_by_id.return_value = existing
        uow.rank_repo.get_ranks_by_game_id.return_value = [existing]
        uow.rank_repo.update_rank.side_effect = lambda r: r

        result = use_case.execute(rank_id=1, name="Gold I", value=1000, icon=None)

        assert result.rank_id == 1
        assert result.name == "Gold I"
        assert result.value == 1000
        assert result.icon_url == "/media/games/league_of_legends/ranks/gold.png"

        storage_service.delete_file.assert_not_called()
        storage_service.save_image_file.assert_not_called()
        uow.rank_repo.update_rank.assert_called_once()

    def test_update_rank_change_only_icon(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="League of Legends", icon_url="/icon.png", rank_per_role=True)
        existing = Rank(rank_id=1, name="Gold", value=1000, videogame=vg, icon_url="/media/games/league_of_legends/ranks/gold_old.png")
        uow.rank_repo.get_rank_by_id.return_value = existing
        uow.rank_repo.get_ranks_by_game_id.return_value = [existing]
        uow.rank_repo.update_rank.side_effect = lambda r: r

        mock_icon = MagicMock()
        mock_icon.filename = "gold_new.png"
        mock_icon.file = MagicMock()

        result = use_case.execute(rank_id=1, name="Gold", value=1000, icon=mock_icon)

        assert result.rank_id == 1
        assert result.name == "Gold"
        assert result.value == 1000
        assert result.icon_url == "/media/games/league_of_legends/ranks/gold_new.png"

        storage_service.delete_file.assert_called_once_with("/media/games/league_of_legends/ranks/gold_old.png")
        storage_service.save_image_file.assert_called_once()
        uow.rank_repo.update_rank.assert_called_once()

    def test_update_rank_empty_name(self, mock_deps):
        use_case, _, _ = mock_deps

        with pytest.raises(InvalidRankNameException) as exc_info:
            use_case.execute(rank_id=1, name="   ", value=1000, icon=None)

        assert exc_info.value.status_code == 400

    def test_update_rank_negative_value(self, mock_deps):
        use_case, _, _ = mock_deps

        with pytest.raises(InvalidRankValueException) as exc_info:
            use_case.execute(rank_id=1, name="Gold", value=-10, icon=None)

        assert exc_info.value.status_code == 400

    def test_update_rank_not_found(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.rank_repo.get_rank_by_id.return_value = None

        with pytest.raises(RankNotFoundException) as exc_info:
            use_case.execute(rank_id=999, name="Gold", value=1000, icon=None)

        assert exc_info.value.status_code == 404

    def test_update_rank_duplicate_name_with_other_rank(self, mock_deps):
        use_case, uow, _ = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        rank1 = Rank(rank_id=1, name="Gold", value=1000, videogame=vg, icon_url="/gold.png")
        rank2 = Rank(rank_id=2, name="Platinum", value=2000, videogame=vg, icon_url="/plat.png")

        uow.rank_repo.get_rank_by_id.return_value = rank1
        uow.rank_repo.get_rank_by_name_and_videogame.return_value = rank2

        with pytest.raises(DuplicatedRankNameException) as exc_info:
            use_case.execute(rank_id=1, name="Platinum", value=1500, icon=None)

        assert exc_info.value.status_code == 409

    def test_update_rank_duplicate_value_with_other_rank(self, mock_deps):
        use_case, uow, _ = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        rank1 = Rank(rank_id=1, name="Gold", value=1000, videogame=vg, icon_url="/gold.png")
        rank2 = Rank(rank_id=2, name="Platinum", value=2000, videogame=vg, icon_url="/plat.png")

        uow.rank_repo.get_rank_by_id.return_value = rank1
        uow.rank_repo.get_rank_by_value_and_videogame.return_value = rank2

        with pytest.raises(DuplicatedRankValueException) as exc_info:
            use_case.execute(rank_id=1, name="Gold Updated", value=2000, icon=None)

        assert exc_info.value.status_code == 409

    def test_update_rank_db_error_cleans_up_new_icon(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        rank1 = Rank(rank_id=1, name="Gold", value=1000, videogame=vg, icon_url="/gold_old.png")
        uow.rank_repo.get_rank_by_id.return_value = rank1
        uow.rank_repo.get_ranks_by_game_id.return_value = [rank1]
        uow.rank_repo.update_rank.side_effect = RuntimeError("DB update failure")

        mock_icon = MagicMock()
        mock_icon.filename = "gold_new.png"
        mock_icon.file = MagicMock()

        with pytest.raises(RuntimeError):
            use_case.execute(rank_id=1, name="Gold", value=1200, icon=mock_icon)

        storage_service.delete_file.assert_any_call("/media/games/league_of_legends/ranks/gold_new.png")
