"""SQLAlchemy engine, session factory and the FastAPI DB dependency."""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings

_url = settings.sqlalchemy_database_url
_is_sqlite = _url.startswith("sqlite")

# Neon's pooled connection string already does connection pooling via pgbouncer;
# stacking SQLAlchemy's own pool on top of a serverless function wastes connections.
engine = create_engine(
    _url,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    poolclass=NullPool if not _is_sqlite else None,
    pool_pre_ping=not _is_sqlite,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
