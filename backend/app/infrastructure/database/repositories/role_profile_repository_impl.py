from app.application.ports.i_role_profile_repository import IRoleProfileRepository
from app.infrastructure.database.models import RoleProfileORM



class RoleProfileRepositoryImpl(IRoleProfileRepository):

    def __init__(self, session):
        self.session = session

    def reassign_associated_to_rank(self, source_rank_id: int, target_rank_id: int) -> int:
        updated_rows = self.session.query(RoleProfileORM).filter(
            RoleProfileORM.rank_id == source_rank_id
        ).update({RoleProfileORM.rank_id: target_rank_id}, synchronize_session='fetch')
        self.session.flush()
        return updated_rows

    def count_associated_to_rank(self, rank_id: int) -> int:
        return self.session.query(RoleProfileORM).filter(RoleProfileORM.rank_id == rank_id).count()

    def count_associated_to_role(self, role_id: int) -> int:
        return self.session.query(RoleProfileORM).filter(RoleProfileORM.role_id == role_id).count()

    def delete_by_role_id(self, role_id: int) -> list[int]:
        role_profiles = self.session.query(RoleProfileORM).filter(
            RoleProfileORM.role_id == role_id
        ).all()
        if not role_profiles:
            return []
        affected_game_profile_ids = list({rp.game_profile_id for rp in role_profiles})
        for role_profile in role_profiles:
            self.session.delete(role_profile)
        self.session.flush()
        return affected_game_profile_ids

    def count_by_game_profile_id(self, game_profile_id: int) -> int:
        return self.session.query(RoleProfileORM).filter(
            RoleProfileORM.game_profile_id == game_profile_id
        ).count()