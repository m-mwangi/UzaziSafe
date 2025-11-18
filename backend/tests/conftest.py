import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from backend.database import Base, engine, SessionLocal, get_db
from backend.main import app
from backend import models
from backend.utils import create_access_token


# Test database setup
@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# Per-test DB session
@pytest.fixture
def db_session() -> Session:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


# Override FastAPI DB dependency
def override_get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# FastAPI test client
@pytest.fixture
def client():
    return TestClient(app)

# Auth helper: creates user + returns header
@pytest.fixture
def auth_header_for_user(db_session):
    """
    Helper that creates a fresh user and returns:
      headers, user
    """

    def _create(
        email: str,
        full_name: str,
        is_provider: bool,
        hospital_name="UzaziSafe Health Center",
        role=None
    ):
        user = models.User(
            full_name=full_name,
            email=email,
            hashed_password="fake-hash",
            is_provider=is_provider,
            role=role,
            hospital_name=hospital_name,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        token = create_access_token({"sub": user.email})
        headers = {"Authorization": f"Bearer {token}"}
        return headers, user

    return _create
