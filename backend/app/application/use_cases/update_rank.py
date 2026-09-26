from typing import cast
from fastapi import UploadFile

from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.rank.duplicated_rank_name_exception import DuplicatedRankNameException
from app.domain.exceptions.rank.duplicated_rank_value_exception import DuplicatedRankValueException
from app.domain.exceptions.rank.invalid_rank_name_exception import InvalidRankNameException
from app.domain.exceptions.rank.invalid_rank_value_exception import InvalidRankValueException
from app.domain.exceptions.rank.rank_not_found_exception import RankNotFoundException
from app.domain.services.slug_service import SlugService
from app.infrastructure.api.dto.response.base_classes.rank_object_response import RankObjectResponse


class UpdateRank:
    def __init__(self, storage_service: IStorageService, uow: IUnitOfWork):
        self.storage_service = storage_service
        self.uow: IUnitOfWork = uow

    def execute(
        self,
        rank_id: int,
        name: str,
        value: int,
        icon: UploadFile | None = None
    ) -> RankObjectResponse:
        # Comprobar que el nombre no esté vacío
        if not name or not name.strip():
            raise InvalidRankNameException(name if name is not None else "")

        # Comprobar que el valor es válido
        if value < 0:
            raise InvalidRankValueException(value)

        cleaned_name = name.strip()

        with self.uow as uow:
            existing_rank = uow.rank_repo.get_rank_by_id(rank_id)
            if not existing_rank:
                raise RankNotFoundException(rank_id)

            # Comprobar que no hay otro rango en el mismo videojuego con el mismo nombre o valor
            game_id = existing_rank.videogame.videogame_id
            existing_ranks = uow.rank_repo.get_ranks_by_game_id(cast(int,game_id))
            for other_rank in existing_ranks:
                if other_rank.rank_id != rank_id:
                    if other_rank.name == cleaned_name:
                        raise DuplicatedRankNameException(cleaned_name)
                    if other_rank.value == value:
                        raise DuplicatedRankValueException(value)

            old_icon_url = existing_rank.icon_url
            new_icon_url = existing_rank.icon_url
            if icon and icon.filename:
                game_folder = SlugService.to_slug(existing_rank.videogame.name)

                new_icon_url = self.storage_service.save_image_file(
                    file_content=icon.file,
                    filename=icon.filename,
                    subfolder=f"games/{game_folder}/ranks",
                    preserve_original_name=True
                )
                existing_rank.icon_url = new_icon_url

            existing_rank.name = cleaned_name
            existing_rank.value = value

            try:
                updated_rank = uow.rank_repo.update_rank(existing_rank)
            except Exception as e:
                if new_icon_url:
                    self.storage_service.delete_file(new_icon_url)
                    old_icon_url = None
                raise e
            finally:
                try:
                    if old_icon_url:
                        self.storage_service.delete_file(old_icon_url)
                except Exception as e:
                    print(f'Error al borrar la imagen {old_icon_url}')

        return RankObjectResponse(
            rank_id=cast(int, updated_rank.rank_id),
            name=updated_rank.name,
            value=updated_rank.value,
            icon_url=updated_rank.icon_url,
        )
