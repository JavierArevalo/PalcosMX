"""
db.py
SQLite + SQLAlchemy plumbing for Palcos.

The prototype persists to a single `palcos.db` file in the repo root
(created on first run). There are no migrations — if the schema changes,
delete `palcos.db` and it will be recreated and reseeded on next start.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, scoped_session, sessionmaker

# check_same_thread=False: Flask's dev server handles requests on
# multiple threads; scoped_session gives each thread its own Session.
engine = create_engine(
    "sqlite:///palcos.db",
    connect_args={"check_same_thread": False},
)

db_session = scoped_session(sessionmaker(bind=engine))


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    """Create all tables (idempotent). Models must be imported first so
    they are registered on Base.metadata."""
    import models  # noqa: F401  (registers the mapped classes)

    Base.metadata.create_all(engine)
