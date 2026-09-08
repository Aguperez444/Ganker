import shutil
import uuid
from pathlib import Path
from typing import BinaryIO

from app.application.ports.i_storage_service import IStorageService
from app.domain.exceptions.file.storage_security_error import StorageSecurityError
from app.domain.services.slug_service import SlugService
from app.infrastructure.config.settings import settings


class LocalDiskStorageService(IStorageService):
    def __init__(self, base_dir: Path | None = None, base_url: str | None = None):
        raw_base_dir = base_dir if base_dir is not None else settings.media_dir
        self.base_dir = Path(raw_base_dir).resolve()

        raw_base_url = base_url if base_url is not None else settings.media_url
        self.base_url = raw_base_url.rstrip("/")

    def _resolve_and_validate_path(self, relative_path: str | Path) -> Path:
        """
        Resuelve la ruta completa y válida que permanezca estrictamente
        dentro del directorio base de almacenamiento para evitar Path Traversal.
        """
        cleaned_path = str(relative_path).lstrip("/")
        full_path = (self.base_dir / cleaned_path).resolve()

        if not full_path.is_relative_to(self.base_dir):
            raise StorageSecurityError("Intento de acceso no autorizado fuera del directorio de medios.")

        return full_path

    def save_image_file(
            self,
            file_content: BinaryIO,
            filename: str,
            subfolder: str,
            preserve_original_name: bool = False
    ) -> str:
        # 1. Valida extensión permitida y genera slug del nombre
        clean_stem, ext = SlugService.sanitize_image_filename(filename)

        # 2. Resuelve la subcarpeta y asegura que no intente subir niveles
        target_dir = self._resolve_and_validate_path(subfolder)
        target_dir.mkdir(parents=True, exist_ok=True)

        # 3. Determina el nombre del archivo
        if preserve_original_name:
            target_filename = f"{clean_stem}.{ext}"
            file_path = target_dir / target_filename

            counter = 1
            while file_path.exists():
                target_filename = f"{clean_stem}_{counter}.{ext}"
                file_path = target_dir / target_filename
                counter += 1
        else:
            target_filename = f"{uuid.uuid4().hex}.{ext}"
            file_path = target_dir / target_filename

        # 4. Asegura el puntero al inicio y copia el stream en bloques de 1MB
        if hasattr(file_content, "seek"):
            file_content.seek(0)

        with open(file_path, "wb") as destination:
            shutil.copyfileobj(file_content, destination, length=1024 * 1024)

        # 5. Construye la URL sin dobles barras si subfolder viene vacío
        clean_sub = subfolder.strip("/")
        url_path = f"{clean_sub}/{target_filename}" if clean_sub else target_filename
        return f"{self.base_url}/{url_path}"

    def delete_file(self, file_path: str) -> bool:
        # Extrae la ruta relativa quitando el base_url
        clean_relative = file_path.removeprefix(self.base_url).lstrip("/")
        full_path = self._resolve_and_validate_path(clean_relative)

        if full_path.exists() and full_path.is_file():
            full_path.unlink()
            return True
        return False