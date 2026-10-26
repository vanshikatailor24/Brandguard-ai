"""
backend/tests/test_document_service.py
Unit tests for document validation and candidate rule extraction.
"""
from app.services.document_service import (
    validate_document_file,
    extract_text_from_document,
    extract_candidate_rules_from_text,
)


class TestDocumentValidation:
    def test_rejects_unsupported_extensions(self):
        valid, msg = validate_document_file("malicious.exe", b"content")
        assert valid is False
        assert "Unsupported file extension" in msg

    def test_rejects_empty_file(self):
        valid, msg = validate_document_file("guide.txt", b"")
        assert valid is False
        assert "empty" in msg

    def test_rejects_oversized_file(self):
        large_bytes = b"x" * (11 * 1024 * 1024)
        valid, msg = validate_document_file("large.txt", large_bytes)
        assert valid is False
        assert "exceeds maximum allowed size" in msg

    def test_rejects_fake_pdf(self):
        valid, msg = validate_document_file("document.pdf", b"Not a real PDF header")
        assert valid is False
        assert "missing '%PDF-'" in msg

    def test_accepts_valid_txt_file(self):
        valid, msg = validate_document_file("brand_policy.txt", b"Brand policy content here.")
        assert valid is True
        assert msg == ""


class TestCandidateRuleExtraction:
    def test_extracts_prohibited_phrases(self):
        text = (
            "Section 2: Marketing Restrictions\n"
            "Do not use 'cheapest in town' in any customer emails.\n"
            "Never claim 'unlimited bandwidth' without tier specification.\n"
        )
        candidates = extract_candidate_rules_from_text(text, "policy.txt")
        assert len(candidates) >= 1
        rule_texts = [c.rule_text.lower() for c in candidates]
        assert any("cheapest in town" in r for r in rule_texts)
        # All candidate rules must require human review (is_approved=False)
        assert all(c.is_approved is False for c in candidates)

    def test_extracts_required_disclaimers(self):
        text = (
            "Section 5: Legal Requirements\n"
            "All promotional posts must include 'Terms and conditions apply'.\n"
        )
        candidates = extract_candidate_rules_from_text(text, "legal.txt")
        assert len(candidates) >= 1
        disclaimers = [c for c in candidates if c.category in ("required_phrase", "required_disclaimer")]
        assert len(disclaimers) >= 1
        assert "terms and conditions apply" in disclaimers[0].rule_text.lower()
