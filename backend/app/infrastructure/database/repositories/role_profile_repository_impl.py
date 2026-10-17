from app.application.ports.i_role_profile_repository import IRoleProfileRepository
from app.infrastructure.database.models import RoleProfileORM



class RoleProfileRepositoryImpl(IRoleProfileRepository):

    def __init__(self, session):
        self.session = session

    def reassign_associated_to_rank(self, source_rank_id: int, target_rank_id: int) -> int:
        updated_rows = self.session.query(RoleProfileORM).filter(
            RoleProfileORM.rank_id == source_rank_id,
            RoleProfileORM.deleted == False,
        ).update({RoleProfileORM.rank_id: target_rank_id}, synchronize_session='fetch')
        self.session.flush()
        return updated_rows

    def count_associated_to_rank(self, rank_id: int) -> int:
        return self.session.query(RoleProfileORM).filter(
            RoleProfileORM.rank_id == rank_id,
            RoleProfileORM.deleted == False,
        ).count()

    def count_associated_to_role(self, role_id: int) -> int:
        return self.session.query(RoleProfileORM).filter(
            RoleProfileORM.role_id == role_id,
            RoleProfileORM.deleted == False,
        ).count()

    def delete_by_role_id(self, role_id: int) -> list[int]:
        role_profiles = self.session.query(RoleProfileORM).filter(
            RoleProfileORM.role_id == role_id,
            RoleProfileORM.deleted == False,
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
            RoleProfileORM.game_profile_id == game_profile_id,
            RoleProfileORM.deleted == False,
        ).count()

    def soft_delete_by_role_id(self, role_id: int) -> list[int]:
        role_profiles = self.session.query(RoleProfileORM).filter(
            RoleProfileORM.role_id == role_id,
            RoleProfileORM.deleted == False,
        ).all()
        if not role_profiles:
            return []
        affected_game_profile_ids = list({rp.game_profile_id for rp in role_profiles})
        for role_profile in role_profiles:
            role_profile.deleted = True
        self.session.flush()
        return affected_game_profile_ids

    def soft_delete_by_game_profile_id(self, game_profile_id: int) -> int:
        updated = self.session.query(RoleProfileORM).filter(
            RoleProfileORM.game_profile_id == game_profile_id,
            RoleProfileORM.deleted == False,
        ).update({RoleProfileORM.deleted: True}, synchronize_session='fetch')
        self.session.flush()
        return updated

    def soft_delete_by_game_profile_ids(self, game_profile_ids: list[int]) -> int:
        if not game_profile_ids:
            return 0
        updated = self.session.query(RoleProfileORM).filter(
            RoleProfileORM.game_profile_id.in_(game_profile_ids),
            RoleProfileORM.deleted == False,
        ).update({RoleProfileORM.deleted: True}, synchronize_session='fetch')
        self.session.flush()
        return updated