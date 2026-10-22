from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.user_summary_response import UserSummaryResponse


class SearchUsers:
    def __init__(self, uow: IUnitOfWork):
        self._uow = uow

    def execute(self, username: str, limit: int = 20, offset: int = 0) -> list[UserSummaryResponse]:
        with self._uow as uow:
            users = uow.user_repo.search_users_by_username(username, limit=limit, offset=offset)
            return [
                UserSummaryResponse(
                    user_id=user.user_id,
                    username=user.username,
                    name=user.name,
                    icon_url=user.icon_url,
                )
                for user in users
            ]
