import logging
import os
from datetime import datetime, timezone
from pathlib import Path

from app.application.ports.i_storage_service import IStorageService
from app.application.ports.i_unit_of_work import IUnitOfWork
from app.domain.exceptions.ban_appeal.ban_appeal_already_exists_exception import (
    BanAppealAlreadyExistsException,
)
from app.domain.exceptions.ban_appeal.ban_appeal_image_too_large_exception import (
    BanAppealImageTooLargeException,
)
from app.domain.exceptions.ban_appeal.ban_not_appealable_exception import (
    BanNotAppealableException,
)
from app.domain.exceptions.ban_appeal.invalid_ban_appeal_image_extension_exception import (
    InvalidBanAppealImageExtensionException,
)
from app.domain.exceptions.ban_appeal.invalid_ban_appeal_text_exception import (
    InvalidBanAppealTextException,
)
from app.domain.exceptions.ban_appeal.too_many_ban_appeal_images_exception import (
    TooManyBanAppealImagesException,
)
from app.domain.models.ban_appeal import BanAppeal, BanAppealStatus

MAX_APPEAL_IMAGES = 3
MAX_APPEAL_IMAGE_BYTES = 2 * 1024 * 1024
MAX_APPEAL_TEXT_LENGTH = 3000
logger = logging.getLogger(__name__)


class CreateBanAppeal:
    def __init__(self, uow: IUnitOfWork, storage: IStorageService):
        self.uow = uow
        self.storage = storage

    def execute(self, user_id: int, ban_id: int, text: str, images=()):
        text = text.strip()
        if not text or len(text) > MAX_APPEAL_TEXT_LENGTH:
            raise InvalidBanAppealTextException()
        if len(images) > MAX_APPEAL_IMAGES:
            raise TooManyBanAppealImagesException()
        saved = []
        try:
            with self.uow as uow:
                ban = uow.ban_appeal_repo.get_ban(user_id, ban_id, lock=True)
                if ban is None or not ban.active:
                    raise BanNotAppealableException()
                if uow.ban_appeal_repo.get_by_ban(ban_id) is not None:
                    raise BanAppealAlreadyExistsException()
                for file, filename in images:
                    if not filename or Path(filename).suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
                        raise InvalidBanAppealImageExtensionException()
                    file.seek(0, os.SEEK_END)
                    size = file.tell()
                    file.seek(0)
                    if size > MAX_APPEAL_IMAGE_BYTES:
                        raise BanAppealImageTooLargeException()
                    saved.append(self.storage.save_image_file(file, filename, "appeals/evidence", preserve_original_name=False))
                appeal = uow.ban_appeal_repo.save(BanAppeal(
                    appeal_id=None, ban=ban, text=text, status=BanAppealStatus.PENDING,
                    created_at=datetime.now(timezone.utc), images=saved,
                ))
            return appeal
        except Exception:
            for url in saved:
                try:
                    self.storage.delete_file(url)
                except Exception:
                    logger.exception("No se pudo eliminar una imagen de una apelación fallida")
            raise
