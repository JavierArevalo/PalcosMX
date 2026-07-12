"""
db.py
SQLAlchemy plumbing for Palcos.

Defaults to a local SQLite file (`palcos.db` in the working directory);
point PALCOS_DATABASE_URL at Postgres (or any SQLAlchemy URL) in production.
Schema is managed by Alembic migrations (see migrations/); init_db() brings
any database — fresh, pre-Alembic, or outdated — to the current head.
"""

import os

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import DeclarativeBase, scoped_session, sessionmaker

DATABASE_URL = os.environ.get("PALCOS_DATABASE_URL", "sqlite:///palcos.db")

# check_same_thread=False: Flask's dev server handles requests on
# multiple threads; scoped_session gives each thread its own Session.
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args)

db_session = scoped_session(sessionmaker(bind=engine))


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    """Create all tables (idempotent). Models must be imported first so
    they are registered on Base.metadata."""
    import models  # noqa: F401  (registers the mapped classes)

    Base.metadata.create_all(engine)
