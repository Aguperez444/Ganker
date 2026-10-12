import html
import re
from typing import BinaryIO
import defusedxml.ElementTree as ET
from defusedxml.common import DefusedXmlException, EntitiesForbidden, DTDForbidden
from xml.etree.ElementTree import ParseError

from app.domain.exceptions.file.invalid_file_content_error import InvalidFileContentError
from app.domain.services.slug_service import SlugService


DISALLOWED_SVG_TAGS = {
    "script",
    "foreignobject",
    "iframe",
    "frame",
    "frameset",
    "object",
    "embed",
    "applet",
    "meta",
    "link",
    "base",
    "form",
    "input",
    "button",
    "textarea",
    "select",
    "audio",
    "video",
    "handler",
    "listener",
}

DANGEROUS_STYLE_PATTERNS = [
    r"javascript\s*:",
    r"expression\s*\(",
    r"behavior\s*:",
    r"@import",
    r"-moz-binding",
    r"url\s*\(\s*['\"]?\s*javascript:",
    r"url\s*\(\s*['\"]?\s*data:",
]


class FileValidationService:
    @classmethod
    def validate_image_file(cls, file_content: BinaryIO, filename: str) -> tuple[str, str]:
        """
        Valida el nombre, extensión y el contenido real del archivo de imagen.
        Devuelve (nombre_base_limpio, extension).
        Lanza DomainException si el archivo o su contenido no son válidos.
        """
        clean_stem, ext = SlugService.sanitize_image_filename(filename)

        if hasattr(file_content, "seek"):
            file_content.seek(0)

        content = file_content.read()

        if hasattr(file_content, "seek"):
            file_content.seek(0)

        cls.validate_image_content(content, ext)

        return clean_stem, ext

    @classmethod
    def validate_image_content(cls, content: bytes, ext: str) -> None:
        """
        Valida que los bytes del archivo correspondan realmente con la extensión indicada
        y que no contengan código malicioso o no permitido.
        """
        if not content or len(content) == 0:
            raise InvalidFileContentError("El archivo no puede estar vacío.")

        normalized_ext = ext.lower().lstrip(".")

        if normalized_ext == "svg":
            cls._validate_svg_content(content)
        elif normalized_ext in {"png", "jpg", "jpeg", "webp"}:
            cls._validate_binary_image_content(content, normalized_ext)
        else:
            raise InvalidFileContentError(f"Tipo de archivo no soportado: .{normalized_ext}")

    @classmethod
    def _validate_binary_image_content(cls, content: bytes, ext: str) -> None:
        # Prevenir archivos de texto, scripts o HTML disfrazados con extensión binaria
        header_sample = content[:512].lower()
        if any(marker in header_sample for marker in (b"<script", b"<html", b"<?php", b"<!doctype", b"<svg")):
            raise InvalidFileContentError(
                f"El contenido del archivo no coincide con el tipo de imagen esperado (.{ext})."
            )

        if ext == "png":
            if not content.startswith(b"\x89PNG\r\n\x1a\n"):
                raise InvalidFileContentError("El archivo no coincide con una imagen PNG válida.")
        elif ext in {"jpg", "jpeg"}:
            if not content.startswith(b"\xff\xd8\xff"):
                raise InvalidFileContentError("El archivo no coincide con una imagen JPEG válida.")
        elif ext == "webp":
            if not (content.startswith(b"RIFF") and b"WEBP" in content[8:16]):
                raise InvalidFileContentError("El archivo no coincide con una imagen WEBP válida.")

    @classmethod
    def _parse_svg(cls, content: bytes) -> ET.Element:
        try:
            return ET.fromstring(content)
        except (EntitiesForbidden, DTDForbidden):
            raise InvalidFileContentError("El archivo SVG contiene entidades XML no permitidas.")
        except DefusedXmlException:
            raise InvalidFileContentError("El archivo SVG contiene contenido XML no seguro.")
        except ParseError as e:
            # Si el error es por prefijos no declarados (habitual en editores vectoriales como Inkscape),
            # intentamos declarar los prefijos faltantes antes de descartar
            if "unbound prefix" in str(e).lower():
                try:
                    text = content.decode("utf-8", errors="replace")
                    used_prefixes = set(re.findall(r"([a-zA-Z0-9_\-]+):[a-zA-Z0-9_\-]+=", text))
                    declared_prefixes = set(re.findall(r"xmlns:([a-zA-Z0-9_\-]+)=", text))
                    missing = used_prefixes - declared_prefixes
                    if missing:
                        decl = " ".join(f'xmlns:{p}="urn:dummy:{p}"' for p in missing)
                        modified = re.sub(r"(<svg[^>]*)(>)", rf"\1 {decl}\2", text, count=1)
                        return ET.fromstring(modified.encode("utf-8"))
                except (EntitiesForbidden, DTDForbidden):
                    raise InvalidFileContentError("El archivo SVG contiene entidades XML no permitidas.")
                except Exception:
                    pass
            raise InvalidFileContentError("El archivo SVG no tiene un formato XML válido.")
        except Exception:
            raise InvalidFileContentError("El archivo SVG no tiene un formato XML válido.")

    @classmethod
    def _validate_svg_content(cls, content: bytes) -> None:
        root = cls._parse_svg(content)

        root_tag = root.tag.split("}")[-1].lower() if "}" in root.tag else root.tag.lower()
        if root_tag != "svg":
            raise InvalidFileContentError("El archivo no es un documento SVG válido.")

        for elem in root.iter():
            elem_tag = elem.tag.split("}")[-1].lower() if "}" in elem.tag else elem.tag.lower()
            if elem_tag in DISALLOWED_SVG_TAGS:
                raise InvalidFileContentError(
                    f"El archivo SVG contiene etiquetas no permitidas: <{elem_tag}>."
                )

            # Validar animaciones que intenten modificar atributos sensibles
            if elem_tag in {"animate", "set"}:
                target_attr = elem.attrib.get("attributeName", "").lower()
                if target_attr in {"href", "xlink:href"} or target_attr.startswith("on"):
                    raise InvalidFileContentError(
                        "El archivo SVG contiene animaciones sobre atributos no permitidos."
                    )

            for attr_key, attr_val in elem.attrib.items():
                attr_name = attr_key.split("}")[-1].lower() if "}" in attr_key else attr_key.lower()

                # Atributos de eventos JavaScript (onload, onclick, onmouseover, etc.)
                if attr_name.startswith("on"):
                    raise InvalidFileContentError(
                        f"El archivo SVG contiene manejadores de eventos no permitidos: '{attr_name}'."
                    )

                # Validar atributos style inline
                if attr_name == "style" and isinstance(attr_val, str):
                    if any(re.search(pat, attr_val, re.IGNORECASE) for pat in DANGEROUS_STYLE_PATTERNS):
                        raise InvalidFileContentError("El archivo SVG contiene estilos no permitidos.")

                # URIs peligrosas en atributos (javascript:, vbscript:, data:text/html, etc.)
                if isinstance(attr_val, str):
                    unescaped_val = html.unescape(attr_val)
                    normalized_val = re.sub(r"[\s\x00-\x1f\\]", "", unescaped_val).lower()
                    if any(
                        scheme in normalized_val
                        for scheme in ("javascript:", "vbscript:", "data:text/html", "data:application/")
                    ):
                        raise InvalidFileContentError(
                            f"El archivo SVG contiene enlaces o scripts no permitidos en el atributo '{attr_name}'."
                        )

            # Validar etiquetas <use> con referencias externas
            if elem_tag == "use":
                href_val = elem.attrib.get("href") or elem.attrib.get("{http://www.w3.org/1999/xlink}href", "")
                if isinstance(href_val, str) and any(
                    href_val.lower().strip().startswith(p)
                    for p in ("http://", "https://", "//", "javascript:", "data:")
                ):
                    raise InvalidFileContentError(
                        "El archivo SVG contiene referencias externas no permitidas en elementos <use>."
                    )

            # Validar hojas de estilo internas
            if elem_tag == "style":
                style_text = (elem.text or "").lower()
                if any(re.search(pat, style_text, re.IGNORECASE) for pat in DANGEROUS_STYLE_PATTERNS):
                    raise InvalidFileContentError("El archivo SVG contiene estilos no permitidos.")

            # Validar atributos style inline
            if elem.attrib.get("style"):
                style_attr = elem.attrib.get("style", "").lower()
                if any(re.search(pat, style_attr, re.IGNORECASE) for pat in DANGEROUS_STYLE_PATTERNS):
                    raise InvalidFileContentError("El archivo SVG contiene atributos de estilo no permitidos.")
