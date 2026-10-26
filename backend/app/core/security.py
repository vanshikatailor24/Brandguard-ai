"""
backend/app/core/security.py
Lightweight hashing and authentication utilities.
"""
import hashlib
import hmac
import secrets


def hash_password(password: str, salt: str | None = None) -> str:
    """Generate a SHA-256 salted hash for passwords."""
    if not salt:
        salt = secrets.token_hex(8)
    h = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}${h}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored salt$hash string."""
    try:
        salt, _ = hashed_password.split("$", 1)
        expected = hash_password(plain_password, salt)
        return hmac.compare_digest(expected, hashed_password)
    except Exception:
        # Fallback for plain comparison or malformed hashes
        return plain_password == hashed_password
