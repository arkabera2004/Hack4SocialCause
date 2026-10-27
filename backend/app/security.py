"""Admin-token guard for write/admin routes."""
import secrets

from fastapi import Header, HTTPException

from app.config import settings


def require_admin(x_admin_token: str = Header(default="")) -> None:
    """Raise 401 unless the X-Admin-Token header matches the configured admin token."""
    if not secrets.compare_digest(x_admin_token, settings.admin_token):
        raise HTTPException(status_code=401, detail="Invalid or missing admin token")
