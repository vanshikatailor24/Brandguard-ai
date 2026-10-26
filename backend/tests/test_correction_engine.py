"""
backend/tests/test_correction_engine.py
Unit tests for the 'Fix It for Me' automatic text correction engine.
"""
from app.services.review_engine import Finding
from app.services.correction_engine import generate_correction, ProposedChange


class TestCorrectionEngine:
    def test_replaces_unapproved_brand_terminology(self):
        original = "We built Brand Guard to help your business."
        findings = [
            Finding(
                finding_id="fnd-1",
                rule_id=1,
                rule_category="brand_terminology",
                rule_text="Brandguard AI",
                finding_type="violation",
                matched_text="Brand Guard",
                reason="Unapproved variant",
                suggestion="Use Brandguard AI",
            )
        ]
        result = generate_correction(original, findings)
        assert result.has_changes is True
        assert "Brandguard AI" in result.proposed_text
        assert "Brand Guard" not in result.proposed_text
        assert len(result.changes) == 1
        assert result.changes[0].original_text == "Brand Guard"
        assert result.changes[0].proposed_text == "Brandguard AI"

    def test_appends_missing_required_disclaimer(self):
        original = "Save 20% on all subscriptions this month."
        findings = [
            Finding(
                finding_id="fnd-2",
                rule_id=2,
                rule_category="required_disclaimer",
                rule_text="Terms and conditions apply.",
                finding_type="violation",
                matched_text=None,
                reason="Missing required disclaimer",
                suggestion="Add disclaimer",
            )
        ]
        result = generate_correction(original, findings)
        assert result.has_changes is True
        assert "Terms and conditions apply." in result.proposed_text
        assert result.proposed_text.startswith(original)

    def test_preserves_original_content_without_overwriting(self):
        original = "This is our original untouched marketing copy."
        result = generate_correction(original, [])
        assert result.original_text == original
        assert result.proposed_text == original
        assert result.has_changes is False

    def test_guards_protected_facts_and_prices(self):
        original = "Get 500GB storage for $199 on October 26, 2026."
        result = generate_correction(original, [])
        assert any("$199" in g for g in result.protected_elements_guarded)
        assert any("500GB" in g for g in result.protected_elements_guarded)
        assert any("October 26, 2026" in g for g in result.protected_elements_guarded)
        # Content remains completely preserved
        assert "$199" in result.proposed_text

    def test_flags_prohibited_phrase_for_manual_guidance(self):
        original = "Our system is 100% guaranteed to double revenue."
        findings = [
            Finding(
                finding_id="fnd-3",
                rule_id=3,
                rule_category="prohibited_phrase",
                rule_text="100% guaranteed",
                finding_type="violation",
                matched_text="100% guaranteed",
                reason="Prohibited claim",
                suggestion="Remove claim",
            )
        ]
        result = generate_correction(original, findings)
        # Should not blindly destroy syntax; provides manual guidance instead
        assert len(result.manual_guidance) >= 1
        assert "100% guaranteed" in result.manual_guidance[0]
