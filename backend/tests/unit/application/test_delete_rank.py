from unittest.mock import MagicMock
import pytest

from app.application.use_cases.delete_rank import DeleteRank
from app.application.ports.i_storage_service import IStorageService
from app.domain.models.videogame import Videogame
from app.domain.models.rank import Rank
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.domain_exception import DomainException


class TestDeleteRankUseCase:

    @pytest.fixture
    def mock_deps(self):
        uow = MagicMock()
        uow.__enter__.return_value = uow
        uow.__exit__.return_value = None
        uow.rank_repo = MagicMock()

        storage_service = MagicMock(spec=IStorageService)
        storage_service.delete_file = MagicMock(return_value=True)

        use_case = DeleteRank(storage_service=storage_service, uow=uow)
        return use_case, uow, storage_service

    def test_delete_rank_happy_path_no_active_dependencies(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        rank = Rank(rank_id=10, name="Gold", value=1000, videogame=vg, icon_url="/media/gold.png")

        uow.rank_repo.get_rank_by_id.return_value = rank
        uow.rank_repo.count_associated_profiles.return_value = 0

        res = use_case.execute(rank_id=10)

        assert "exitosamente" in res.message.lower()
        uow.rank_repo.reassign_associated_profiles.assert_not_called()
        uow.rank_repo.delete_rank.assert_called_once_with(10)
        storage_service.delete_file.assert_called_once_with("/media/gold.png")

    def test_delete_rank_with_associated_profiles_reassigns_to_inferior(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        bronze = Rank(rank_id=1, name="Bronze", value=500, videogame=vg, icon_url="/bronze.png")
        silver = Rank(rank_id=2, name="Silver", value=1000, videogame=vg, icon_url="/silver.png")
        gold = Rank(rank_id=3, name="Gold", value=1500, videogame=vg, icon_url="/gold.png")
        platinum = Rank(rank_id=4, name="Platinum", value=2000, videogame=vg, icon_url="/plat.png")

        uow.rank_repo.get_rank_by_id.return_value = gold
        uow.rank_repo.count_associated_profiles.return_value = 5
        uow.rank_repo.get_ranks_by_game_id.return_value = [bronze, silver, gold, platinum]

        res = use_case.execute(rank_id=3)

        assert "exitosamente" in res.message.lower()
        # El inmediatamente inferior a Gold (1500) es Silver (1000)
        uow.rank_repo.reassign_associated_profiles.assert_called_once_with(source_rank_id=3, target_rank_id=2)
        uow.rank_repo.delete_rank.assert_called_once_with(3)
        storage_service.delete_file.assert_called_once_with("/gold.png")

    def test_delete_rank_with_associated_profiles_reassigns_to_superior_when_no_inferior(self, mock_deps):
        use_case, uow, storage_service = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        bronze = Rank(rank_id=1, name="Bronze", value=500, videogame=vg, icon_url="/bronze.png")
        silver = Rank(rank_id=2, name="Silver", value=1000, videogame=vg, icon_url="/silver.png")
        gold = Rank(rank_id=3, name="Gold", value=1500, videogame=vg, icon_url="/gold.png")

        uow.rank_repo.get_rank_by_id.return_value = bronze
        uow.rank_repo.count_associated_profiles.return_value = 2
        uow.rank_repo.get_ranks_by_game_id.return_value = [bronze, silver, gold]

        res = use_case.execute(rank_id=1)

        assert "exitosamente" in res.message.lower()
        # Como Bronze es el rango más bajo, se reasigna al inmediatamente superior: Silver (1000)
        uow.rank_repo.reassign_associated_profiles.assert_called_once_with(source_rank_id=1, target_rank_id=2)
        uow.rank_repo.delete_rank.assert_called_once_with(1)
        storage_service.delete_file.assert_called_once_with("/bronze.png")

    def test_delete_rank_not_found_raises_exception(self, mock_deps):
        use_case, uow, _ = mock_deps
        uow.rank_repo.get_rank_by_id.return_value = None

        with pytest.raises(RankNotFoundException) as exc_info:
            use_case.execute(rank_id=999)

        assert exc_info.value.status_code == 404

    def test_delete_rank_with_dependencies_and_no_alternative_ranks_raises_exception(self, mock_deps):
        use_case, uow, _ = mock_deps

        vg = Videogame(videogame_id=1, name="LoL", icon_url="/icon.png", rank_per_role=True)
        single_rank = Rank(rank_id=1, name="OnlyRank", value=500, videogame=vg, icon_url="/only.png")

        uow.rank_repo.get_rank_by_id.return_value = single_rank
        uow.rank_repo.count_associated_profiles.return_value = 1
        uow.rank_repo.get_ranks_by_game_id.return_value = [single_rank]

        with pytest.raises(DomainException) as exc_info:
            use_case.execute(rank_id=1)

        assert exc_info.value.status_code == 400
        assert "no existe otro rango" in exc_info.value.message.lower()
