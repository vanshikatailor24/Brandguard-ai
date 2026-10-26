"""
backend/tests/test_review_engine.py
Unit tests for the deterministic review engine.
Run with: pytest tests/
No database or external services required.
"""
import pytest
from app.services.review_engine import run_review, Finding


# ── Minimal rule stub (matches RuleLike protocol) ─────────────────────────────

class StubRule:
    def __init__(self, id, category, rule_text, description=None, is_approved=True):
        self.id = id
        self.category = category
        self.rule_text = rule_text
        self.description = description
        self.is_approved = is_approved


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestNoRules:
    def test_empty_rules_returns_no_rules_status(self):
        result = run_review("Some content text here.", [])
        assert result.review_status == "no_rules"
        assert result.rules_checked == 0
        assert result.violations_found == 0

    def test_unapproved_rules_treated_as_no_rules(self):
        unapproved = StubRule(1, "prohibited_phrase", "bad word", is_approved=False)
        result = run_review("This has a bad word in it.", [unapproved])
        assert result.review_status == "no_rules"


class TestProhibitedPhrase:
    def test_detects_prohibited_phrase(self):
        rule = StubRule(1, "prohibited_phrase", "guaranteed results")
        result = run_review("We offer guaranteed results for all clients.", [rule])
        assert result.review_status == "fail"
        assert result.violations_found == 1
        assert result.findings[0].finding_type == "violation"
        assert "guaranteed results" in result.findings[0].matched_text.lower()

    def test_no_violation_when_phrase_absent(self):
        rule = StubRule(1, "prohibited_phrase", "guaranteed results")
        result = run_review("We work hard to deliver quality outcomes.", [rule])
        assert result.review_status == "pass"
        assert result.violations_found == 0

    def test_case_insensitive_detection(self):
        rule = StubRule(1, "prohibited_phrase", "guaranteed results")
        result = run_review("We offer GUARANTEED RESULTS.", [rule])
        assert result.violations_found == 1


class TestRequiredPhrase:
    def test_detects_missing_required_phrase(self):
        rule = StubRule(2, "required_phrase", "past performance is not indicative of future results")
        result = run_review("Invest in our fund today.", [rule])
        assert result.review_status == "fail"
        assert result.violations_found == 1

    def test_passes_when_required_phrase_present(self):
        rule = StubRule(2, "required_phrase", "past performance is not indicative of future results")
        text = "Invest with us. Past performance is not indicative of future results."
        result = run_review(text, [rule])
        assert result.review_status == "pass"


class TestRequiredDisclaimer:
    def test_required_disclaimer_treated_like_required_phrase(self):
        rule = StubRule(3, "required_disclaimer", "terms and conditions apply")
        result = run_review("Buy now and save!", [rule])
        assert result.review_status == "fail"


class TestBrandTerminology:
    def test_detects_unapproved_variant(self):
        # approved term: "Brandguard AI", variants: "brand guard, brandguard"
        rule = StubRule(4, "brand_terminology", "Brandguard AI", description="brand guard, brandguard")
        result = run_review("Check out brand guard for your needs.", [rule])
        assert result.violations_found >= 1
        assert result.review_status == "fail"

    def test_no_violation_when_approved_term_used(self):
        rule = StubRule(4, "brand_terminology", "Brandguard AI", description="brand guard, brandguard")
        result = run_review("Check out Brandguard AI for your needs.", [rule])
        assert result.review_status == "pass"


class TestMultipleRules:
    def test_multiple_violations_counted(self):
        rules = [
            StubRule(1, "prohibited_phrase", "guaranteed"),
            StubRule(2, "required_phrase", "terms apply"),
        ]
        result = run_review("We guaranteed results for you.", rules)
        assert result.violations_found == 2
        assert result.review_status == "fail"

    def test_suggestions_present_in_findings(self):
        rule = StubRule(1, "prohibited_phrase", "guaranteed")
        result = run_review("We guaranteed results.", [rule])
        assert result.findings[0].suggestion is not None
