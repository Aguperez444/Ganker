from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.ban_appeal.ban_appeal_not_found_exception import (
    BanAppealNotFoundException,
)
from app.domain.exceptions.ban_appeal.ban_not_found_exception import BanNotFoundException


class QueryBanAppeals:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, username=None, status=None, skip=0, limit=10):
        with self.uow as uow:
            return uow.ban_appeal_repo.search(username, status, skip, limit)

    def get_detail(self, appeal_id):
        with self.uow as uow:
            appeal = uow.ban_appeal_repo.get_by_id(appeal_id)
            if appeal is None:
                raise BanAppealNotFoundException()
            return appeal

    def get_own(self, user_id, ban_id):
        with self.uow as uow:
            ban = uow.ban_appeal_repo.get_ban(user_id, ban_id)
            if ban is None:
                raise BanNotFoundException()
            return ban, uow.ban_appeal_repo.get_by_ban(ban_id)
