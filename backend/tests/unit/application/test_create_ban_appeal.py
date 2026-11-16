from datetime import datetime, timezone
from io import BytesIO
from unittest.mock import MagicMock

import pytest

from app.application.use_cases.create_ban_appeal import CreateBanAppeal
from app.domain.models.ban_appeal import AppealableBan


def test_commit_failure_removes_all_uploaded_appeal_images():
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.ban_appeal_repo.get_ban.return_value = AppealableBan(1, 7, "ana", "Motivo", datetime.now(timezone.utc), None, True)
    uow.ban_appeal_repo.get_by_ban.return_value = None
    uow.__exit__.side_effect = RuntimeError("commit failed")
    storage = MagicMock()
    storage.save_image_file.side_effect = ["/media/a.png", "/media/b.png"]
    use_case = CreateBanAppeal(uow, storage)

    with pytest.raises(RuntimeError, match="commit failed"):
        use_case.execute(7, 1, "Apelo mi baneo", images=[(BytesIO(b"a"), "a.png"), (BytesIO(b"b"), "b.png")])

    assert {call.args[0] for call in storage.delete_file.call_args_list} == {"/media/a.png", "/media/b.png"}
