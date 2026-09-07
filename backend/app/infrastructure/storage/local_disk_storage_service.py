import uuid
import aiofiles
from pathlib import Path
from typing import BinaryIO

from app.application.ports.i_storage_service import IStorageService
from app.infrastructure.config.settings import settings
from app.domain.services.slug_service import SlugService
from app.domain.exceptions.file.storage_security_error import StorageSecurityError


class LocalDiskStorageService(IStorageService):
    def __init__(self, base_dir: Path | None = None, base_url: str | None = None):
        self.base_dir = base_dir if base_dir is not None else settings.media_dir
        self.base_url = (base_url if base_url is not None else settings.media_url).rstrip("/")

    def _resolve_and_validate_path(self, relative_path: str | Path) -> Path:
        """
        Resuelve la ruta completa y válida que permanezca estrictamente
        dentro del directorio base de almacenamiento.
        """
        # Limpiamos posibles barras al inicio para que el operador / no ignore self.base_dir
        cleaned_path = str(relative_path).lstrip("/")
        full_path = (self.base_dir / cleaned_path).resolve()

        if not full_path.is_relative_to(self.base_dir):
            raise StorageSecurityError("Intento de acceso no autorizado fuera del directorio de medios.")

        return full_path

    async def save_image_file(self, file_content: BinaryIO, filename: str, subfolder: str, preserve_original_name: bool = False) -> str:
        # Obtener el nombre sanitizado y la extensión del archivo
        # 1. Válida extensión y genera el slug del nombre
        clean_stem, ext = SlugService.sanitize_image_filename(filename)

        # el service es el encargado de validar que el nombre del archivo sea válido y que la extensión sea permitida,
        # si no lo es, se lanza una excepción InvalidFileExtensionError

        # Construir el path completo del archivo en el sistema de archivos
        # 2. Resuelve la sub carpeta y válida que no escape de base_dir (por si mandan"../")
        target_dir = self._resolve_and_validate_path(subfolder)
        target_dir.mkdir(parents=True, exist_ok=True)

        # 3. Generación del nombre del archivo final
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

        # Retornar URL pública usando subfolder sanitizada
        clean_sub = subfolder.strip("/")
        url_path = f"{clean_sub}/{target_filename}" if clean_sub else target_filename
        return f"{self.base_url}/{url_path}"

    async def delete_file(self, file_path: str) -> bool:
        # Extraemos la ruta relativa respecto a base_url
        clean_relative = file_path.removeprefix(self.base_url).lstrip("/")

        # Validamos que no intente subir niveles con ../../
        full_path = self._resolve_and_validate_path(clean_relative)

        if full_path.exists() and full_path.is_file():
            full_path.unlink()
            return True
        return False