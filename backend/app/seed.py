"""Create an optional local demo user (example.com, since login rejects .local).

    docker compose exec api python -m app.seed

Uses SEED_EMAIL and SEED_PASSWORD when set. Running it again changes nothing.
For local development only.
"""

from __future__ import annotations

import os

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User

DEFAULT_EMAIL = "demo@example.com"
DEFAULT_PASSWORD = "smartdoc-demo"


def seed_user(email: str, password: str) -> bool:
    """Returns True when the user was created, False when it already existed."""
    with SessionLocal() as db:
        if db.query(User).filter(User.email == email).first():
            return False
        db.add(User(email=email, hashed_password=get_password_hash(password)))
        db.commit()
        return True


def main() -> None:
    email = os.environ.get("SEED_EMAIL", DEFAULT_EMAIL)
    password = os.environ.get("SEED_PASSWORD", DEFAULT_PASSWORD)
    created = seed_user(email, password)
    print(f"{'Created' if created else 'Already present'}: {email}")


if __name__ == "__main__":
    main()
