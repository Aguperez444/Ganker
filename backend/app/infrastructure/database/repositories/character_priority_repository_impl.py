from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import func

from app.application.ports.i_character_priority_repository import ICharacterPriorityRepository
from app.infrastructure.database.mappers.character_mapper import CharacterMapper
from app.infrastructure.database.models import CharacterORM, CharacterPriorityORM, GameProfileORM

if TYPE_CHECKING:
    from app.domain.models.character import Character


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

        # Guardamos los ID de los perfiles de juego afectados
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

    def get_character_usage(
        self,
        videogame_id: Optional[int],
        start_date: Optional[datetime],
        end_date: Optional[datetime],
    ) -> list[tuple['Character', int]]:
        """
        Devuelve cada personaje junto con la cantidad de jugadores (perfiles de juego distintos) que
        lo seleccionaron, opcionalmente acotado a un videojuego y a un rango de fechas de creación de
        los perfiles. Si no se especifica videojuego, se consideran los personajes de todos los videojuegos.
        """
        query = (
            self.session.query(
                CharacterORM,
                func.count(func.distinct(CharacterPriorityORM.game_profile_id)),
            )
            .join(CharacterPriorityORM, CharacterPriorityORM.character_id == CharacterORM.character_id)
            .join(GameProfileORM, GameProfileORM.game_profile_id == CharacterPriorityORM.game_profile_id)
        )

        if videogame_id is not None:
            query = query.filter(CharacterORM.videogame_id == videogame_id)
        if start_date is not None:
            query = query.filter(GameProfileORM.created_at >= start_date)
        if end_date is not None:
            query = query.filter(GameProfileORM.created_at <= end_date)

        rows = query.group_by(CharacterORM.character_id).all()
        return [(CharacterMapper.orm_to_domain(character), int(count)) for character, count in rows]
