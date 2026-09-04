import uuid
import aiofiles
from pathlib import Path
from typing import BinaryIO

from app.application.ports.i_storage_service import IStorageService
from app.infrastructure.config.settings import settings
from app.domain.services.slug_service import SlugService


class LocalDiskStorageService(IStorageService):
    def __init__(self, base_dir: Path = settings.media_dir, base_url: str = settings.media_url):
        self.base_dir = base_dir
        self.base_url = base_url.rstrip("/")

    async def save_file(
        self,
        file_content: BinaryIO,
        filename: str,
        subfolder: str,
        preserve_original_name: bool = False
    ) -> str:
        #obtener el nombre sanitizado y la extensión del archivo
        clean_stem, ext = SlugService.sanitize_filename(filename)

        # construir el path completo del archivo en el sistema de archivos
        target_dir = self.base_dir / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)

        if preserve_original_name:
            target_filename = f"{clean_stem}.{ext}"
            file_path = target_dir / target_filename

            # Si ya existe un archivo con ese nombre, agregamos un sufijo corto para no sobreescribir
            counter = 1
            while file_path.exists():
                target_filename = f"{clean_stem}_{counter}.{ext}"
                file_path = target_dir / target_filename
                counter += 1
        else:
            # Comportamiento por defecto con UUID
            target_filename = f"{uuid.uuid4().hex}.{ext}"
            file_path = target_dir / target_filename

        # Escritura asíncrona no bloqueante
        async with aiofiles.open(file_path, "wb") as f:
            while chunk := file_content.read(1024 * 1024): # Lee en bloques de 1MB
                await f.write(chunk) # Escribe el bloque leído en el archivo

        return f"{self.base_url}/{subfolder}/{target_filename}"

    async def delete_file(self, file_path: str) -> bool:
        clean_relative = file_path.removeprefix(self.base_url).lstrip("/")
        full_path = self.base_dir / clean_relative

        if full_path.exists():
            full_path.unlink()
            return True
        return False