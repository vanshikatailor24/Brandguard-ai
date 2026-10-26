"""
backend/tests/test_image_service.py
Unit tests for image validation and metadata extraction.
"""
import io
from PIL import Image
from app.services.image_service import validate_image_file, is_tesseract_installed


class TestImageService:
    def _create_sample_png_bytes(self) -> bytes:
        img = Image.new("RGB", (200, 100), color=(23, 63, 53))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

    def test_accepts_valid_png_image(self):
        png_bytes = self._create_sample_png_bytes()
        valid, err, meta = validate_image_file("banner.png", png_bytes)
        assert valid is True
        assert err == ""
        assert meta.get("width") == 200
        assert meta.get("height") == 100
        assert meta.get("format") == "PNG"

    def test_rejects_unsupported_image_extension(self):
        valid, err, _ = validate_image_file("vector.svg", b"<svg></svg>")
        assert valid is False
        assert "Unsupported image format" in err

    def test_rejects_corrupted_image_content(self):
        valid, err, _ = validate_image_file("banner.png", b"Not real PNG data at all")
        assert valid is False
        assert "Invalid or corrupted image" in err

    def test_tesseract_detection_returns_boolean(self):
        installed = is_tesseract_installed()
        assert isinstance(installed, bool)
