from typing import BinaryIO, cast
from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork

from app.domain.models.rank import Rank
from app.domain.exceptions.rank.duplicated_rank_name_exception import DuplicatedRankNameException
from app.domain.exceptions.rank.duplicated_rank_value_exception import DuplicatedRankValueException
from app.domain.exceptions.rank.invalid_rank_name_exception import InvalidRankNameException
from app.domain.exceptions.rank.invalid_rank_value_exception import InvalidRankValueException
from app.domain.exceptions.videogame.videogame_not_found_exception import VideogameNotFoundException
from app.domain.services.slug_service import SlugService
from app.infrastructure.api.dto.response.base_classes.rank_object_response import RankObjectResponse


class CreateRank:
    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service = storage_service
        self.uow: IUnitOfWork = uow

    def execute(self, game_id: int, name: str, icon_stream: BinaryIO, filename: str, value: int) -> RankObjectResponse:
        # Comprobar que el nombre no está vacío
        if not name.strip():
            raise InvalidRankNameException(name)

        # Comprobar que el valor es válido
        if value < 0:
            raise InvalidRankValueException(value)

        # Comprobar que existe el juego
        with self.uow as uow:
            game = uow.videogame_repo.get_videogame_by_id(game_id)
            if not game:
                raise VideogameNotFoundException(game_id)

            # obtener los rangos de ese juego y comprobar que no hay otro rango con el mismo valor o nombre
            existing_ranks = uow.rank_repo.get_ranks_by_game_id(game_id)
            for rank in existing_ranks:
                if rank.name == name:
                    raise DuplicatedRankNameException(name)
                if rank.value == value:
                    raise DuplicatedRankValueException(value)

            # confirmado que este rango es nuevo y único para ese juego, se puede crear y persistir
            # Sanitizar el nombre del juego para la sub carpeta (ej: "League of Legends" -> "league_of_legends")
            game_folder = SlugService.to_slug(game.name)

            # Guardar imagen a través del puerto
            icon_url = self.storage_service.save_image_file(
                file_content=icon_stream,
                filename=filename,
                subfolder=f"{game_folder}/ranks",
                preserve_original_name=True
            )

            # Persistir los cambios con seguridad de rollback si algo falla
            try:
                # Crear entidad de dominio con la URL resuelta
                new_rank = Rank(rank_id=None, name=name, value=value, icon_url=icon_url, videogame=game)

                # Persistir en base de datos vía repositorio
                saved_rank = uow.rank_repo.save_rank(new_rank)
            except Exception as e:
                # Evitar basura en disco si la BD rechaza la inserción
                self.storage_service.delete_file(icon_url)
                raise e # volver a levantar la excepción después de limpiar el archivo para hacer rollback

        return RankObjectResponse(
            rank_id=cast(int, saved_rank.rank_id),
            name=saved_rank.name,
            value=saved_rank.value,
            icon_url=saved_rank.icon_url,
        )