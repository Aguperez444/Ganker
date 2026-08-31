from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.update_videogame_profile_request import UpdateGameProfileRequest
from app.domain.exceptions.rank_not_found_exception import RankNotFoundException
from app.domain.exceptions.role_not_found_exception import RoleNotFoundException
from app.domain.exceptions.videogame_not_found_exception import VideogameNotFoundException
from app.domain.models.videogame import Videogame
from app.domain.models.role_profile import RoleProfile
from app.domain.models.game_profile import GameProfile


class UpdateGameProfile:
    
    # Recibo videogame_id, list[characters_id], list[roles] (cada role tiene role_id y rank_id) y un unite_of_works
    def __init__(self, unit_of_work: IUnitOfWork):
        self.uow: IUnitOfWork = unit_of_work

    def execute(self,player_id: int, update_game_profile_request: UpdateGameProfileRequest) -> GameProfile:
        pass