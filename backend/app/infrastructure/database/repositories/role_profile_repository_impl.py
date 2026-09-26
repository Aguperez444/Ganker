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