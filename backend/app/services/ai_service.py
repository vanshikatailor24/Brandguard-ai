"""
backend/app/services/ai_service.py

LLM & Multimodal AI Fallback Integration Service for Brandguard AI.

Integrates optional external AI providers (OpenAI / Gemini) with an absolute
zero-crash guarantee. If keys are missing, invalid, or network times out,
the platform seamlessly falls back to our local deterministic rule engine,
contextual regex heuristics, and host/manual OCR without throwing 500 errors.
"""
from __future__ import annotations

import logging
from typing import Any
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def get_ai_status() -> dict[str, Any]:
    """Return status of AI providers and active mode."""
    settings = get_settings()
    gemini_key = settings.effective_gemini_key
    openai_key = settings.OPENAI_API_KEY.strip()

    openai_ok = bool(openai_key)
    gemini_ok = bool(gemini_key)
    active = settings.active_ai_provider

    active_model = settings.OPENAI_MODEL if active == "openai" else (
        settings.GEMINI_MODEL if active == "gemini" else "local_deterministic_v1"
    )

    return {
        "openai_configured": openai_ok,
        "google_ai_configured": gemini_ok,
        "gemini_configured": gemini_ok,
        "active_provider": active,
        "active_model": active_model,
        "fallback_guarantee": "active",
        "fallback_engine": "Local Deterministic Engine + Contextual Heuristics + OCR",
        "is_ai_enabled": openai_ok or gemini_ok,
    }


def analyze_tone_nuance_with_ai(
    content_text: str,
    rules_context: list[str] | None = None,
) -> dict[str, Any]:
    """
    Attempt to run contextual tone & nuance evaluation using configured LLM.
    Guaranteed to NEVER raise an uncaught exception — returns clean fallback payload on failure.
    """
    settings = get_settings()
    fallback_result: dict[str, Any] = {
        "ai_applied": False,
        "provider": "local_fallback",
        "tone_analysis": "Evaluated using local deterministic brand governance and contextual rules.",
        "ai_suggestions": [],
    }

    if not settings.is_ai_available:
        return fallback_result

    rules_summary = "\n".join(f"- {r}" for r in (rules_context or [])[:10])

    # 1. Attempt OpenAI if configured
    if settings.OPENAI_API_KEY.strip():
        try:
            headers = {
                "Authorization": f"Bearer {settings.OPENAI_API_KEY.strip()}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": settings.OPENAI_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are Brandguard AI governance assistant. Analyze marketing text for brand tone, "
                            "clarity, and regulatory nuance. Keep reply under 60 words."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Rules context:\n{rules_summary}\n\nContent:\n{content_text[:1500]}",
                    },
                ],
                "max_tokens": 120,
                "temperature": 0.2,
            }
            with httpx.Client(timeout=4.0) as client:
                res = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    advice = data["choices"][0]["message"]["content"].strip()
                    return {
                        "ai_applied": True,
                        "provider": "openai",
                        "model": settings.OPENAI_MODEL,
                        "tone_analysis": advice,
                        "ai_suggestions": [advice],
                    }
        except Exception as exc:
            logger.warning("OpenAI tone analysis fallback triggered: %s", exc)

    # 2. Attempt Gemini if configured
    gemini_key = settings.effective_gemini_key
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": (
                                    f"Brandguard AI tone review. Rules:\n{rules_summary}\n\nContent:\n{content_text[:1500]}\n"
                                    "Briefly evaluate tone and clarity in under 50 words."
                                )
                            }
                        ]
                    }
                ],
                "generationConfig": {"maxOutputTokens": 100, "temperature": 0.2},
            }
            with httpx.Client(timeout=4.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0]["content"]["parts"][0]["text"].strip()
                        return {
                            "ai_applied": True,
                            "provider": "gemini",
                            "model": settings.GEMINI_MODEL,
                            "tone_analysis": text,
                            "ai_suggestions": [text],
                        }
        except Exception as exc:
            logger.warning("Gemini tone analysis fallback triggered: %s", exc)

    return fallback_result

