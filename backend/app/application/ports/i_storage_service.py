from abc import ABC, abstractmethod
from typing import BinaryIO

class IStorageService(ABC):
    @abstractmethod
    async def save_file(
        self,
        file_content: BinaryIO,
        filename: str,
        subfolder: str,
        preserve_original_name: bool = False
    ) -> str:
        """Guarda el archivo y devuelve la URL o ruta pública accesible."""
        pass

    @abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        pass