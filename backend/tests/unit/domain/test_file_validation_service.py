import io
import pytest

from app.domain.exceptions.file.invalid_file_content_error import InvalidFileContentError
from app.domain.services.file_validation_service import FileValidationService
from tests.conftest import VALID_PNG_BYTES, VALID_JPG_BYTES, VALID_SVG_BYTES


class TestFileValidationService:

    def test_empty_content_raises(self):
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(b"", "png")
        assert "no puede estar vacío" in str(exc.value.message)

    def test_valid_png_content_success(self):
        FileValidationService.validate_image_content(VALID_PNG_BYTES, "png")

    def test_invalid_png_magic_bytes_raises(self):
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(b"not_png_bytes", "png")
        assert "PNG válida" in str(exc.value.message)

    def test_png_containing_html_script_raises(self):
        corrupted = b"<script>alert(1)</script>" + VALID_PNG_BYTES
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(corrupted, "png")
        assert "no coincide con el tipo de imagen esperado" in str(exc.value.message)

    def test_valid_jpeg_content_success(self):
        FileValidationService.validate_image_content(VALID_JPG_BYTES, "jpg")
        FileValidationService.validate_image_content(VALID_JPG_BYTES, "jpeg")

    def test_invalid_jpeg_magic_bytes_raises(self):
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(b"not_jpeg_bytes", "jpg")
        assert "JPEG válida" in str(exc.value.message)

    def test_valid_webp_content_success(self):
        webp_bytes = b"RIFF\x18\x00\x00\x00WEBPVP8 \x0c\x00\x00\x00\x30\x01\x00\x9d\x01\x2a\x01\x00\x01\x00\x02\x00\x34\x25"
        FileValidationService.validate_image_content(webp_bytes, "webp")

    def test_invalid_webp_bytes_raises(self):
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(b"RIFF_corrupted_header", "webp")
        assert "WEBP válida" in str(exc.value.message)

    def test_unsupported_extension_raises(self):
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(b"some content", "bmp")
        assert "Tipo de archivo no soportado" in str(exc.value.message)

    def test_valid_svg_success(self):
        FileValidationService.validate_image_content(VALID_SVG_BYTES, "svg")

    def test_valid_svg_with_doctype_success(self):
        svg_doctype = (
            b'<?xml version="1.0" encoding="utf-8"?>\n'
            b'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'
            b'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><circle cx="5" cy="5" r="5"/></svg>'
        )
        FileValidationService.validate_image_content(svg_doctype, "svg")

    def test_valid_svg_with_local_use_success(self):
        svg_use = (
            b'<svg xmlns="http://www.w3.org/2000/svg">'
            b'<defs><g id="circle"><circle cx="5" cy="5" r="5"/></g></defs>'
            b'<use href="#circle"/>'
            b'</svg>'
        )
        FileValidationService.validate_image_content(svg_use, "svg")

    def test_valid_svg_with_unbound_prefix_success(self):
        svg_unbound = (
            b'<svg xmlns="http://www.w3.org/2000/svg">'
            b'<path d="M 0,0 L 10,10" sodipodi:nodetypes="cc"/>'
            b'</svg>'
        )
        FileValidationService.validate_image_content(svg_unbound, "svg")

    def test_malformed_xml_svg_raises(self):
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(b"<svg><circle", "svg")
        assert "formato XML válido" in str(exc.value.message)

    def test_non_svg_root_raises(self):
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(b"<html><body>test</body></html>", "svg")
        assert "no es un documento SVG válido" in str(exc.value.message)

    def test_svg_with_script_tag_raises(self):
        evil = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(evil, "svg")
        assert "<script>" in str(exc.value.message)

    def test_svg_with_namespaced_script_tag_raises(self):
        evil = b'<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg"><s:script>alert(1)</s:script></svg>'
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(evil, "svg")
        assert "<script>" in str(exc.value.message)

    def test_svg_with_foreign_object_raises(self):
        evil = (
            b'<svg xmlns="http://www.w3.org/2000/svg">'
            b'<foreignObject width="100" height="50">'
            b'<body xmlns="http://www.w3.org/1999/xhtml"><p>test</p></body>'
            b'</foreignObject></svg>'
        )
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(evil, "svg")
        assert "<foreignobject>" in str(exc.value.message)

    @pytest.mark.parametrize("event_attr", ["onload", "onerror", "onclick", "onmouseover", "onfocus", "onanimationstart"])
    def test_svg_with_event_handler_attribute_raises(self, event_attr):
        evil = f'<svg xmlns="http://www.w3.org/2000/svg" {event_attr}="alert(1)"><circle r="5"/></svg>'.encode()
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(evil, "svg")
        assert "manejadores de eventos" in str(exc.value.message)

    @pytest.mark.parametrize("bad_uri", [
        'javascript:alert(1)',
        'JAVASCRIPT:alert(1)',
        '  javascript:alert(1)',
        'java\nscript:alert(1)',
        'java\\script:alert(1)',
        'jav&#97;script:alert(1)',
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        'vbscript:msgbox(1)',
    ])
    def test_svg_with_dangerous_uri_attribute_raises(self, bad_uri):
        evil = f'<svg xmlns="http://www.w3.org/2000/svg"><a href="{bad_uri}"><text>Click</text></a></svg>'.encode()
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(evil, "svg")
        assert "enlaces o scripts no permitidos" in str(exc.value.message)

    def test_svg_with_animate_targeting_href_raises(self):
        evil = (
            b'<svg xmlns="http://www.w3.org/2000/svg">'
            b'<animate attributeName="href" values="#target"/>'
            b'</svg>'
        )
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(evil, "svg")
        assert "animaciones sobre atributos no permitidos" in str(exc.value.message)

    def test_svg_with_external_use_raises(self):
        evil = b'<svg xmlns="http://www.w3.org/2000/svg"><use href="http://evil.com/x.svg#test"/></svg>'
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(evil, "svg")
        assert "referencias externas no permitidas" in str(exc.value.message)

    def test_svg_with_dangerous_style_tag_raises(self):
        evil = b'<svg xmlns="http://www.w3.org/2000/svg"><style>circle { fill: expression(alert(1)); }</style><circle r="5"/></svg>'
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(evil, "svg")
        assert "estilos no permitidos" in str(exc.value.message)

    def test_svg_with_dangerous_style_attribute_raises(self):
        evil = b'<svg xmlns="http://www.w3.org/2000/svg"><circle r="5" style="width: expression(alert(1))"/></svg>'
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(evil, "svg")
        assert "estilos no permitidos" in str(exc.value.message)

    def test_svg_with_xxe_entity_raises(self):
        evil = (
            b'<?xml version="1.0"?>'
            b'<!DOCTYPE svg ['
            b'  <!ENTITY xxe SYSTEM "file:///etc/passwd">'
            b']>'
            b'<svg xmlns="http://www.w3.org/2000/svg"><text>&xxe;</text></svg>'
        )
        with pytest.raises(InvalidFileContentError) as exc:
            FileValidationService.validate_image_content(evil, "svg")
        assert "entidades XML no permitidas" in str(exc.value.message)

    def test_validate_image_file_stream_seek_preservation(self):
        stream = io.BytesIO(VALID_PNG_BYTES)
        clean_stem, ext = FileValidationService.validate_image_file(stream, "my_avatar.png")
        assert clean_stem == "my_avatar"
        assert ext == "png"
        # Ensure stream is rewinded to 0
        assert stream.tell() == 0
        assert stream.read() == VALID_PNG_BYTES
