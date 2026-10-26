"""
backend/app/services/review_engine.py

Brand-rule review engine for Brandguard AI.

Supports deterministic checks across four core categories:
  - prohibited_phrase   : rule_text must NOT appear in content
  - required_phrase     : rule_text MUST appear in content
  - required_disclaimer : required disclaimer phrase or clause
  - brand_terminology   : approved canonical term; description lists unapproved variants

Also performs contextual guidance checks (e.g., subjective/exaggerated claims)
flagged with certainty='needs_review' so users know human judgement is needed.

Design notes:
  - Deterministic checks are case-insensitive with substring/token boundary awareness.
  - Approved terms are masked when scanning for variant substrings to avoid false positives.
  - Never claims 100% legal or regulatory accuracy.
  - Only APPROVED rules (is_approved=True) are authoritative.
"""
from __future__ import annotations

import re
import datetime
from dataclasses import dataclass, field
from typing import Protocol, runtime_checkable, Any


# ── Rule protocol (matches ORM model and plain dicts/stubs) ──────────────────

@runtime_checkable
class RuleLike(Protocol):
    id: int | None
    category: str
    rule_text: str
    description: str | None
    is_approved: bool


# ── Finding dataclass ─────────────────────────────────────────────────────────

@dataclass
class Finding:
    rule_id: int | None
    rule_category: str
    rule_text: str
    finding_type: str                   # "violation" | "warning" | "info"
    matched_text: str | None
    reason: str
    suggestion: str | None
    finding_id: str = ""
    severity: str = "warning"           # "critical" | "warning" | "info"
    start_index: int | None = None
    end_index: int | None = None
    applicable_rule: str = ""
    evidence: str = ""
    certainty: str = "certain"          # "certain" | "needs_review"
    requires_human_review: bool = False
    is_protected_conflict: bool = False


# ── Review result ─────────────────────────────────────────────────────────────

@dataclass
class ReviewResult:
    review_status: str                  # "pass" | "fail" | "no_rules"
    rules_checked: int
    violations_found: int
    findings: list[Finding] = field(default_factory=list)
    message: str = ""
    created_at: datetime.datetime = field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )


# ── Contextual claim indicators (heuristic checks) ───────────────────────────

CONTEXTUAL_PATTERNS = [
    (
        r"\b(miracle|revolutionary product|foolproof|never fail|100% error-free)\b",
        "Subjective or absolute claim detected.",
        "Consider replacing hyperbolic language with factual, demonstrable performance metrics.",
    ),
    (
        r"\b(unbeatable prices?|cheapest in the world|lowest price anywhere)\b",
        "Unsubstantiated comparative pricing claim.",
        "Ensure pricing claims are substantiated by documented market research or qualified with clear scope.",
    ),
]


# ── Engine ────────────────────────────────────────────────────────────────────

def run_review(
    content_text: str,
    rules: list[Any],
    check_contextual: bool = True,
) -> ReviewResult:
    """
    Run a brand-rule review of *content_text* against *rules*.

    Only approved rules are evaluated for compliance decisions.
    Returns a ReviewResult describing the outcome.
    """
    approved_rules = [r for r in rules if getattr(r, "is_approved", True)]

    if not approved_rules:
        return ReviewResult(
            review_status="no_rules",
            rules_checked=0,
            violations_found=0,
            message=(
                "No approved brand rules exist yet. "
                "Content was not checked against company-specific guidelines. "
                "Add and approve rules in the Brand Guidelines section first."
            ),
        )

    lower_content = content_text.lower()
    findings: list[Finding] = []
    finding_counter = 1

    for rule in approved_rules:
        category = getattr(rule, "category", "").strip().lower()
        rule_text = getattr(rule, "rule_text", "").strip()
        rule_text_lower = rule_text.lower()
        rule_id = getattr(rule, "id", None)
        rule_desc = getattr(rule, "description", None) or ""
        rule_severity = getattr(rule, "severity", "warning") or "warning"
        is_protected = getattr(rule, "is_protected", False)
        source_excerpt = getattr(rule, "source_excerpt", None) or f"Rule #{rule_id or 'N/A'}: {rule_text}"

        # ── 1. Prohibited Phrase Check ──────────────────────────────────────
        if category == "prohibited_phrase":
            if rule_text_lower in lower_content:
                idx = lower_content.find(rule_text_lower)
                matched = content_text[idx: idx + len(rule_text)]
                findings.append(
                    Finding(
                        finding_id=f"fnd-{finding_counter}",
                        rule_id=rule_id,
                        rule_category=category,
                        rule_text=rule_text,
                        finding_type="violation",
                        severity=rule_severity if rule_severity in ("critical", "warning") else "critical",
                        matched_text=matched,
                        start_index=idx,
                        end_index=idx + len(matched),
                        reason=f"The phrase '{rule_text}' is prohibited by your brand guidelines.",
                        applicable_rule=f"Prohibited Phrase: '{rule_text}'",
                        evidence=source_excerpt,
                        certainty="certain",
                        requires_human_review=False,
                        is_protected_conflict=is_protected,
                        suggestion=f"Remove or replace '{matched}' with an approved alternative.",
                    )
                )
                finding_counter += 1

        # ── 2. Required Phrase & Required Disclaimer Check ───────────────────
        elif category in ("required_phrase", "required_disclaimer"):
            if rule_text_lower not in lower_content:
                findings.append(
                    Finding(
                        finding_id=f"fnd-{finding_counter}",
                        rule_id=rule_id,
                        rule_category=category,
                        rule_text=rule_text,
                        finding_type="violation",
                        severity=rule_severity,
                        matched_text=None,
                        start_index=None,
                        end_index=None,
                        reason=f"The required phrase or disclaimer '{rule_text}' is missing from the content.",
                        applicable_rule=f"Mandatory Requirement: '{rule_text}'",
                        evidence=source_excerpt,
                        certainty="certain",
                        requires_human_review=False,
                        is_protected_conflict=is_protected,
                        suggestion=f"Add the following to your content: '{rule_text}'",
                    )
                )
                finding_counter += 1

        # ── 3. Brand Terminology Check ──────────────────────────────────────
        elif category == "brand_terminology":
            if rule_desc:
                variants = [
                    v.strip().lower()
                    for v in rule_desc.split(",")
                    if v.strip()
                ]
                # Mask approved occurrences so variants that are substrings
                # of the approved term do not trigger false positive violations.
                masked_content = lower_content.replace(rule_text_lower, " " * len(rule_text_lower))
                for variant in variants:
                    if variant in masked_content:
                        idx = masked_content.find(variant)
                        matched = content_text[idx: idx + len(variant)]
                        findings.append(
                            Finding(
                                finding_id=f"fnd-{finding_counter}",
                                rule_id=rule_id,
                                rule_category=category,
                                rule_text=rule_text,
                                finding_type="violation",
                                severity="critical" if is_protected else rule_severity,
                                matched_text=matched,
                                start_index=idx,
                                end_index=idx + len(matched),
                                reason=f"'{matched}' is not the approved brand term. Use '{rule_text}' instead.",
                                applicable_rule=f"Brand Terminology: '{rule_text}'",
                                evidence=source_excerpt,
                                certainty="certain",
                                requires_human_review=False,
                                is_protected_conflict=is_protected,
                                suggestion=f"Replace '{matched}' with '{rule_text}'.",
                            )
                        )
                        finding_counter += 1

    # ── 4. Contextual Nuance Checks (Heuristic warnings) ─────────────────────
    if check_contextual:
        for pattern, reason_text, suggestion_text in CONTEXTUAL_PATTERNS:
            match = re.search(pattern, content_text, re.IGNORECASE)
            if match:
                matched_span = match.group(0)
                findings.append(
                    Finding(
                        finding_id=f"fnd-{finding_counter}",
                        rule_id=None,
                        rule_category="contextual_guidance",
                        rule_text=matched_span,
                        finding_type="warning",
                        severity="info",
                        matched_text=matched_span,
                        start_index=match.start(),
                        end_index=match.end(),
                        reason=reason_text,
                        applicable_rule="Brand Tone & Marketing Integrity Standard",
                        evidence=f"Matched contextual pattern '{matched_span}'",
                        certainty="needs_review",
                        requires_human_review=True,
                        is_protected_conflict=False,
                        suggestion=suggestion_text,
                    )
                )
                finding_counter += 1

    violations = [f for f in findings if f.finding_type == "violation"]
    status = "fail" if violations else "pass"
    message = (
        f"Review complete. {len(violations)} violation(s) found across "
        f"{len(approved_rules)} approved rule(s)."
        if violations
        else f"Content passed all {len(approved_rules)} approved brand rule(s)."
    )

    return ReviewResult(
        review_status=status,
        rules_checked=len(approved_rules),
        violations_found=len(violations),
        findings=findings,
        message=message,
    )
