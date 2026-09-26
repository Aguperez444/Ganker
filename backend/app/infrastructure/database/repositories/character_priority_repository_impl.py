from app.application.ports.i_character_priority_repository import ICharacterPriorityRepository
from app.infrastructure.database.models import CharacterPriorityORM


class CharacterPriorityRepositoryImpl(ICharacterPriorityRepository):

    def __init__(self, session):
        self.session = session

    def count_associated_to_character(self, character_id: int) -> int:
        return self.session.query(CharacterPriorityORM).filter(
            CharacterPriorityORM.character_id == character_id
        ).count()

    def delete_and_readjust_for_character(self, character_id: int) -> None:
        # 1. Obtener todas las asociaciones para este personaje
        associations = self.session.query(CharacterPriorityORM).filter(
            CharacterPriorityORM.character_id == character_id
        ).all()

        if not associations:
            return

        # Guardamos los IDs de los perfiles de juego afectados
        affected_profile_ids = {assoc.game_profile_id for assoc in associations}

        # 2. Eliminar las filas del personaje seleccionado
        for assoc in associations:
            self.session.delete(assoc)
        self.session.flush()

        # 3. Para cada perfil afectado, reajustar las prioridades restantes en orden secuencial (1, 2, 3...)
        for profile_id in affected_profile_ids:
            remaining = self.session.query(CharacterPriorityORM).filter(
                CharacterPriorityORM.game_profile_id == profile_id
            ).order_by(CharacterPriorityORM.priority.asc()).all()

            for new_priority, item in enumerate(remaining, start=1):
                if item.priority != new_priority:
                    item.priority = new_priority
                    self.session.flush()
