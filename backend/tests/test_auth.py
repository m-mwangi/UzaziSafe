# backend/tests/test_auth.py
from backend import models


def test_post_auth_signup_patient__and_login_success(client, db_session):
    email = "patient_signup@example.com"
    db_session.query(models.User).filter_by(email=email).delete()
    db_session.commit()

    signup_payload = {
        "full_name": "Patient X",
        "email": email,
        "password": "StrongP@ss123",
        "hospital_name": "UzaziSafe Health Center",
    }

    res = client.post("/auth/signup/patient", data=signup_payload)
    assert res.status_code == 200
    assert res.json()["email"] == email

    # Login
    res_login = client.post("/auth/login", json={"email": email, "password": "StrongP@ss123"})
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()


def test_post_auth_signup_patient__duplicate_email_fails(client):
    payload = {
        "full_name": "Duplicate User",
        "email": "dup@example.com",
        "password": "Abcd1234!",
        "hospital_name": "UzaziSafe Health Center",
    }

    # First signup
    client.post("/auth/signup/patient", data=payload)

    # Duplicate signup
    res = client.post("/auth/signup/patient", data=payload)

    assert res.status_code == 400
    # Accepts "already exists" OR "already registered"
    assert any(word in res.json()["detail"].lower() for word in ["exist", "registered"])


def test_post_auth_signup_provider__and_login_success(client):
    email = "doctor_signup@example.com"
    payload = {
        "full_name": "Doctor X",
        "email": email,
        "password": "StrongP@ss123",
        "hospital_name": "UzaziSafe Health Center",
        "role": "Doctor",
    }

    res = client.post("/auth/signup/provider", data=payload)
    assert res.status_code == 200
    assert res.json()["is_provider"] is True

    login = client.post("/auth/login", json={"email": email, "password": "StrongP@ss123"})
    assert login.status_code == 200
    assert login.json()["is_provider"] is True


def test_post_auth_signup_provider__duplicate_email_fails(client):
    payload = {
        "full_name": "Doc Y",
        "email": "dupprov@example.com",
        "password": "Pass1234!",
        "hospital_name": "UzaziSafe Health Center",
        "role": "Doctor",
    }

    # First signup
    client.post("/auth/signup/provider", data=payload)

    # Duplicate
    res = client.post("/auth/signup/provider", data=payload)

    assert res.status_code == 400
    # Accepts "already exists" OR "already registered"
    assert any(word in res.json()["detail"].lower() for word in ["exist", "registered"])


def test_post_auth_login__invalid_credentials(client):
    res = client.post("/auth/login", json={"email": "nope@example.com", "password": "wrong"})
    assert res.status_code == 401
