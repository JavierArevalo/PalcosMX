"""
db.py
SQLAlchemy plumbing for Palcos.

Defaults to a local SQLite file (`palcos.db` in the working directory);
point PALCOS_DATABASE_URL at Postgres (or any SQLAlchemy URL) in production.
Schema is managed by Alembic migrations (see migrations/); init_db() brings
any database — fresh, pre-Alembic, or outdated — to the current head.
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import DeclarativeBase, scoped_session, sessionmaker

load_dotenv()  # loads .env in the repo root, if present (local dev convenience)

DATABASE_URL = os.environ.get("PALCOS_DATABASE_URL", "sqlite:///palcos.db")

# check_same_thread=False: Flask's dev server handles requests on
# multiple threads; scoped_session gives each thread its own Session.
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args)

db_session = scoped_session(sessionmaker(bind=engine))


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    """Bring the database schema to the current Alembic head.

    - Fresh/empty database: runs all migrations (creates the full schema).
    - Pre-Alembic database (tables exist but no version marker): stamps it
      as current, adopting it without touching data.
    - Up-to-date database: no-op.
    """
    import models  # noqa: F401  (registers the mapped classes on Base.metadata)

    from alembic import command
    from alembic.config import Config

    cfg = Config(os.path.join(os.path.dirname(os.path.abspath(__file__)), "alembic.ini"))

    inspector = inspect(engine)
    if inspector.has_table("users") and not inspector.has_table("alembic_version"):
        command.stamp(cfg, "head")
    else:
        command.upgrade(cfg, "head")
