"""
backend/tests/test_image_service.py
Unit tests for image validation, OCR text extraction, and multi-tier fallback pipeline.
"""
import io
from PIL import Image
from app.services.image_service import (
    validate_image_file,
    is_tesseract_installed,
    extract_text_from_image,
)
from app.services.ocr_service import (
    extract_text_from_image_bytes,
    get_active_ocr_engine_info,
)


class TestImageService:
    def _create_sample_png_bytes(self, width: int = 200, height: int = 100) -> bytes:
        img = Image.new("RGB", (width, height), color=(23, 63, 53))
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

    def test_active_ocr_engine_info_available(self):
        info = get_active_ocr_engine_info()
        assert info["available"] is True
        assert "engine" in info
        assert "message" in info

    def test_extract_text_from_image_bytes_returns_valid_transcript(self):
        png_bytes = self._create_sample_png_bytes(400, 150)
        res = extract_text_from_image_bytes(png_bytes, "sample_ad.png")
        assert res["ocr_available"] is True
        assert len(res["text"]) > 0
        assert res["transcript"] == res["text"]
        assert len(res["ocr_engine"]) > 0

    def test_extract_text_from_image_pipeline_fallback(self):
        png_bytes = self._create_sample_png_bytes(300, 300)
        text, ok, msg, engine = extract_text_from_image(png_bytes, "campaign_banner.png")
        assert ok is True
        assert len(text) > 0
        assert "Engine" in engine or "Vision" in engine or "OCR" in engine
