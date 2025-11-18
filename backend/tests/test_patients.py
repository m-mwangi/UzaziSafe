from datetime import datetime, timedelta
from backend import models


def test_get_patients_me__basic_dashboard(client, db_session, auth_header_for_user):
    headers, user = auth_header_for_user(
        email="patient_basic@example.com",
        is_provider=False,
        full_name="Basic Patient",
    )

    patient = models.Patient(
        full_name="Basic Patient",
        age=25,
        hospital_name="UzaziSafe Health Center",
        risk_level="Unknown",
        user_id=user.id,
    )
    db_session.add(patient)
    db_session.commit()

    res = client.get("/patients/me", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["full_name"] == "Basic Patient"
    assert data["current_risk_level"] == "Unknown"
    assert data["next_appointment"] is None


def test_get_patients_me__with_risk_and_appointment(client, db_session, auth_header_for_user):
    headers, user = auth_header_for_user(
        email="patient_risk@example.com",
        is_provider=False,
        full_name="Risky Patient",
    )

    patient = models.Patient(
        full_name="Risky Patient",
        age=30,
        hospital_name="UzaziSafe Health Center",
        risk_level="Unknown",
        user_id=user.id,
    )
    db_session.add(patient)
    db_session.commit()

    rh = models.RiskHistory(
        patient_id=patient.id,
        risk_level="High Risk",
        high_risk_probability=0.9,
        low_risk_probability=0.1,
        contributing_factors="{}",
        created_at=datetime.utcnow(),
    )
    db_session.add(rh)

    future = datetime.utcnow() + timedelta(days=1)
    appt = models.Appointment(
        patient_name="Risky Patient",
        date=future,
        appointment_type="Checkup",
        status="Scheduled",
        hospital_name="UzaziSafe Health Center",
        provider_id=None,
    )
    db_session.add(appt)
    db_session.commit()

    res = client.get("/patients/me", headers=headers)
    assert res.status_code == 200

    data = res.json()
    assert data["current_risk_level"] == "High Risk"
    assert str(future.year) in data["next_appointment"]


def test_get_patients_me__forbidden_for_provider(client, auth_header_for_user):
    headers, _ = auth_header_for_user(
        email="prov@example.com",
        is_provider=True,
        full_name="Doc",
        role="Doctor",
    )
    res = client.get("/patients/me", headers=headers)
    assert res.status_code == 403


def test_get_patients_me__unauthenticated(client):
    res = client.get("/patients/me")
    assert res.status_code == 403
