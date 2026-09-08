from abc import ABC, abstractmethod
from typing import BinaryIO


class IStorageService(ABC):
    @abstractmethod
    def save_image_file(
        self,
        file_content: BinaryIO,
        filename: str,
        subfolder: str,
        preserve_original_name: bool = False
    ) -> str:
        pass

    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        pass