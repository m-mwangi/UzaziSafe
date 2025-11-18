from datetime import datetime, timedelta
from backend import models


def test_get_providers_me__dashboard_counts(client, db_session, auth_header_for_user):
    headers, prov = auth_header_for_user(
        email="dashprov@example.com",
        is_provider=True,
        full_name="Dr Dash",
        role="Doctor",
    )

    p1 = models.Patient(full_name="P1", age=20, hospital_name=prov.hospital_name,
                        provider_id=prov.id, user_id=prov.id + 10, risk_level="Low Risk")
    p2 = models.Patient(full_name="P2", age=22, hospital_name=prov.hospital_name,
                        provider_id=prov.id, user_id=prov.id + 11, risk_level="High Risk")
    db_session.add_all([p1, p2])
    db_session.commit()

    now = datetime.utcnow()
    a1 = models.Appointment(patient_name="P1", date=now + timedelta(days=1),
                            appointment_type="X", status="Scheduled",
                            hospital_name=prov.hospital_name, provider_id=prov.id)
    a2 = models.Appointment(patient_name="P2", date=now + timedelta(days=1),
                            appointment_type="Y", status="Scheduled",
                            hospital_name=prov.hospital_name, provider_id=prov.id)
    db_session.add_all([a1, a2])
    db_session.commit()

    res = client.get("/providers/me", headers=headers)
    assert res.status_code == 200

    data = res.json()
    assert data["total_patients"] == 2
    assert data["high_risk_patients"] == 1
    assert data["scheduled_appointments"] == 2


def test_get_providers_me__forbidden_for_non_provider(client, auth_header_for_user):
    headers, _ = auth_header_for_user(
        email="np@example.com", is_provider=False, full_name="User"
    )
    res = client.get("/providers/me", headers=headers)
    assert res.status_code == 403


def test_get_providers_id_patients_and_appointments_lists(client, db_session, auth_header_for_user):
    headers, prov = auth_header_for_user(
        email="listprov@example.com",
        is_provider=True,
        full_name="Listing Doc",
        role="Doctor",
    )

    p1 = models.Patient(full_name="Alpha", age=20, hospital_name=prov.hospital_name,
                        provider_id=prov.id, user_id=prov.id + 100)
    p2 = models.Patient(full_name="Beta", age=25, hospital_name=prov.hospital_name,
                        provider_id=prov.id, user_id=prov.id + 101)
    db_session.add_all([p1, p2])
    db_session.commit()

    now = datetime.utcnow()
    a1 = models.Appointment(patient_name="Alpha", date=now + timedelta(hours=1),
                            appointment_type="Checkup", status="Scheduled",
                            hospital_name=prov.hospital_name, provider_id=prov.id)
    a2 = models.Appointment(patient_name="Beta", date=now + timedelta(hours=2),
                            appointment_type="Scan", status="Scheduled",
                            hospital_name=prov.hospital_name, provider_id=prov.id)
    db_session.add_all([a1, a2])
    db_session.commit()

    r1 = client.get(f"/providers/{prov.id}/patients")
    assert r1.status_code == 200
    assert len(r1.json()) == 2

    r2 = client.get(f"/providers/{prov.id}/appointments")
    assert r2.status_code == 200
    assert len(r2.json()) == 2


def test_get_providers_id_patients__provider_not_found(client):
    assert client.get("/providers/9999/patients").status_code == 404


def test_get_providers_id_appointments__provider_not_found(client):
    assert client.get("/providers/9999/appointments").status_code == 404


def test_get_providers_id_risk_summary_and_activity(client, db_session, auth_header_for_user):
    headers, prov = auth_header_for_user(
        email="sumprov@example.com",
        is_provider=True,
        full_name="Summary Doc",
        role="Doctor",
    )

    patient = models.Patient(
        full_name="SummPatient",
        age=35,
        hospital_name=prov.hospital_name,
        provider_id=prov.id,
        user_id=prov.id + 500,
        risk_level="High Risk",
    )
    db_session.add(patient)
    db_session.commit()

    now = datetime.utcnow()
    rh1 = models.RiskHistory(
        patient_id=patient.id, risk_level="High Risk", high_risk_probability=0.9,
        low_risk_probability=0.1, contributing_factors="{}", created_at=now
    )
    db_session.add(rh1)

    appt = models.Appointment(
        patient_name="SummPatient",
        date=now + timedelta(days=1),
        appointment_type="Review",
        status="Scheduled",
        hospital_name=prov.hospital_name,
        provider_id=prov.id,
        created_at=now,
        updated_at=now,
    )
    db_session.add(appt)
    db_session.commit()

    # summaries
    assert client.get(f"/providers/{prov.id}/risk-summary").status_code == 200
    assert client.get(f"/providers/{prov.id}/activity").status_code == 200
