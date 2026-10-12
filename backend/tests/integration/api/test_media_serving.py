import pytest
from tests.conftest import VALID_SVG_BYTES, VALID_PNG_BYTES
from app.infrastructure.config.settings import settings


class TestMediaServingIntegration:

    def test_media_serving_security_headers_for_svg(self, client):
        # Create a test SVG in media_dir
        svg_file = settings.media_dir / "test_avatar.svg"
        svg_file.write_bytes(VALID_SVG_BYTES)

        response = client.get("/media/test_avatar.svg")
        assert response.status_code == 200
        assert response.headers.get("x-content-type-options") == "nosniff"
        assert response.headers.get("content-security-policy") == "default-src 'none'; style-src 'unsafe-inline'; sandbox"

    def test_media_serving_security_headers_for_png(self, client):
        png_file = settings.media_dir / "test_image.png"
        png_file.write_bytes(VALID_PNG_BYTES)

        response = client.get("/media/test_image.png")
        assert response.status_code == 200
        assert response.headers.get("x-content-type-options") == "nosniff"
        assert response.headers.get("content-security-policy") == "default-src 'none'; style-src 'unsafe-inline'; sandbox"
