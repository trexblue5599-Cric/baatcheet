# ================================
# Auth — password hashing + tokens
# ================================

import hashlib
import secrets
import re


# ================================
# Password
# ================================

def hash_password(password: str, salt: str = None) -> str:
    """
    Simple SHA-256 hash with salt.
    Format: "salt$hash"
    """
    if salt is None:
        salt = secrets.token_hex(16)
    h = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}${h}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, _ = stored.split("$", 1)
    except ValueError:
        return False
    return hash_password(password, salt) == stored


# ================================
# Token
# ================================

def generate_token() -> str:
    return secrets.token_hex(32)


# ================================
# Validation
# ================================

def validate_username(username: str):
    """
    Returns (ok: bool, error: str|None)
    """
    if not username:
        return False, "Username khali hai"
    username = username.strip()
    if len(username) < 3:
        return False, "Username kam se kam 3 characters"
    if len(username) > 20:
        return False, "Username 20 characters se zyada nahi"
    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        return False, "Sirf letters, numbers, underscore allowed"
    return True, None


def validate_password(password: str):
    if not password:
        return False, "Password khali hai"
    if len(password) < 4:
        return False, "Password kam se kam 4 characters"
    if len(password) > 100:
        return False, "Password bahut lamba hai"
    return True, None