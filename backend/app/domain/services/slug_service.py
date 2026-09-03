import re
import unicodedata
from pathlib import Path


class SlugService:
    @staticmethod
    def to_slug(text: str) -> str:
        """
        Normaliza un texto para convertirlo en un identificador o carpeta seguro:
        - Pasa a minúsculas.
        - Elimina tildes y caracteres diacríticos (NFKD).
        - Reemplaza espacios y símbolos inválidos por guiones bajos.
        """
        if not text:
            raise ValueError("El texto no puede estar vacío para generar un slug.")

        normalized = unicodedata.normalize("NFKD", text)
        ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
        clean_text = re.sub(r"[^\w\-_]", "_", ascii_text.lower()).strip("_")

        return clean_text or "unknown"

    @classmethod
    def sanitize_filename(cls, filename: str) -> tuple[str, str]:
        """
        Limpia y normaliza un nombre de archivo.
        Separa un nombre de archivo en (nombre_base_seguro, extension).
        """
        path = Path(filename)
        stem = cls.to_slug(path.stem)
        ext = path.suffix.lower().lstrip(".")
        if not ext:
            ext = "png"

        return stem, ext