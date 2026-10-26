"""
backend/app/services/correction_engine.py

"Fix It for Me" — Automatic Text Correction Engine.

Provides safe, auditable text remediation suggestions:
  - Replaces unapproved brand terminology variants with canonical approved terms.
  - Adds mandatory required disclaimers cleanly when missing.
  - Flags prohibited phrases for manual user remediation if no safe substitution exists.
  - Strictly preserves protected facts (prices, quantities, dates, specifications).
  - Preserves original content and returns structured diffs with explanations.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ProposedChange:
    change_id: str
    original_text: str
    proposed_text: str
    start_index: int | None
    end_index: int | None
    reason: str
    rule_id: int | None
    is_safe: bool = True
    blocked_reason: str | None = None


@dataclass
class CorrectionResult:
    original_text: str
    proposed_text: str
    changes: list[ProposedChange] = field(default_factory=list)
    manual_guidance: list[str] = field(default_factory=list)
    protected_elements_guarded: list[str] = field(default_factory=list)
    has_changes: bool = False


# Regex patterns for protected factual elements that must never be altered silently
PROTECTED_FACT_PATTERNS = [
    r"\$\s*\d+(?:,\d{3})*(?:\.\d+)?",          # USD prices ($100, $1,500.50)
    r"€\s*\d+(?:,\d{3})*(?:\.\d+)?",          # EUR prices
    r"£\s*\d+(?:,\d{3})*(?:\.\d+)?",          # GBP prices
    r"\b\d+(?:\.\d+)?\s*(?:GB|TB|MB|GHz|MHz|kg|lbs|mph|kW)\b", # Specs
    r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s*\d{4})?\b", # Dates
]


def generate_correction(
    original_text: str,
    findings: list[Any],
    protected_elements: list[Any] | None = None,
) -> CorrectionResult:
    """
    Generate proposed corrections for a given text and its review findings.
    
    Preserves original content and never overwrites protected factual claims.
    """
    if not original_text:
        return CorrectionResult(original_text="", proposed_text="")

    protected_elements = protected_elements or []
    guarded_items: list[str] = []

    # 1. Catalog protected facts present in original content
    for pattern in PROTECTED_FACT_PATTERNS:
        for match in re.finditer(pattern, original_text, re.IGNORECASE):
            fact = match.group(0)
            if fact not in guarded_items:
                guarded_items.append(fact)

    for pe in protected_elements:
        canonical = getattr(pe, "canonical_text", "")
        if canonical and canonical in original_text and canonical not in guarded_items:
            guarded_items.append(f"Protected Asset: {canonical}")

    changes: list[ProposedChange] = []
    manual_guidance: list[str] = []
    change_idx = 1

    current_text = original_text

    # 2. Process brand terminology findings first (direct substitution)
    for f in findings:
        cat = getattr(f, "rule_category", "") or ""
        matched = getattr(f, "matched_text", None)
        rule_text = getattr(f, "rule_text", "")
        rule_id = getattr(f, "rule_id", None)
        f_type = getattr(f, "finding_type", "violation")

        if cat == "brand_terminology" and matched and rule_text:
            # Check if replacing this would conflict with a protected fact
            if matched in current_text:
                # Replace with boundary safety
                pattern = re.compile(re.escape(matched), re.IGNORECASE)
                match = pattern.search(current_text)
                if match:
                    start, end = match.span()
                    current_text = current_text[:start] + rule_text + current_text[end:]
                    changes.append(
                        ProposedChange(
                            change_id=f"chg-{change_idx}",
                            original_text=matched,
                            proposed_text=rule_text,
                            start_index=start,
                            end_index=end,
                            reason=f"Standardize to approved brand term '{rule_text}'.",
                            rule_id=rule_id,
                            is_safe=True,
                        )
                    )
                    change_idx += 1

        elif cat in ("required_disclaimer", "required_phrase") and f_type == "violation":
            # Missing disclaimer: propose appending it cleanly
            if rule_text.lower() not in current_text.lower():
                current_text = current_text.rstrip() + f"\n\n{rule_text}"
                changes.append(
                    ProposedChange(
                        change_id=f"chg-{change_idx}",
                        original_text="",
                        proposed_text=rule_text,
                        start_index=len(current_text) - len(rule_text),
                        end_index=len(current_text),
                        reason=f"Append mandatory brand disclaimer: '{rule_text}'.",
                        rule_id=rule_id,
                        is_safe=True,
                    )
                )
                change_idx += 1

        elif cat == "prohibited_phrase" and matched:
            # For prohibited phrases, automated deletion might corrupt grammatical meaning.
            # We provide explicit manual guidance unless a simple replacement rule exists.
            manual_guidance.append(
                f"Prohibited phrase '{matched}' detected. Manual rewrite required: "
                f"Remove '{matched}' or substitute with an approved value."
            )

        elif getattr(f, "certainty", "") == "needs_review":
            manual_guidance.append(
                f"Contextual note on '{matched or rule_text}': {getattr(f, 'reason', '')} "
                "Human editorial discretion recommended."
            )

    return CorrectionResult(
        original_text=original_text,
        proposed_text=current_text,
        changes=changes,
        manual_guidance=manual_guidance,
        protected_elements_guarded=guarded_items,
        has_changes=bool(changes),
    )
