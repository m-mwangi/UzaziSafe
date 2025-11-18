from datetime import datetime, timedelta
from backend import models


def test_post_appointments_book__and_fetch_for_patient_and_provider(client, db_session):
    # Provider
    prov = models.User(
        full_name="Dr A",
        email="prov@app.com",
        hashed_password="hash",
        is_provider=True,
        hospital_name="UzaziSafe Health Center",
        role="Doctor",
    )
    db_session.add(prov)

    # Patient user + profile
    user = models.User(
        full_name="Jane P",
        email="jane@app.com",
        hashed_password="hash",
        is_provider=False,
        hospital_name="UzaziSafe Health Center",
    )
    db_session.add(user)
    db_session.commit()

    patient = models.Patient(
        full_name="Jane P",
        age=27,
        hospital_name="UzaziSafe Health Center",
        risk_level="Unknown",
        user_id=user.id,
        provider_id=prov.id,
    )
    db_session.add(patient)
    db_session.commit()

    # Book appointment
    when = datetime.utcnow() + timedelta(days=1)
    payload = {
        "patient_name": "Jane P",
        "date": when.isoformat(),
        "appointment_type": "Consultation",
        "status": "Scheduled",
        "hospital_name": "UzaziSafe Health Center",
        "provider_id": prov.id,
        "provider_email": prov.email,
    }

    r = client.post("/appointments/book", json=payload)
    assert r.status_code == 200
    new = r.json()

    # patient appointments
    rp = client.get(f"/appointments/patient/{user.email}")
    assert rp.status_code == 200
    assert len(rp.json()) == 1

    # provider appointments
    rprov = client.get(f"/appointments/provider/{prov.email}")
    assert rprov.status_code == 200
    assert len(rprov.json()) == 1

    # update status
    appt_id = new["id"]
    upd = client.put(f"/appointments/{appt_id}/status", json={"status": "Completed"})
    assert upd.status_code == 200
    assert upd.json()["status"] == "Completed"


def test_post_appointments_book__provider_not_found(client):
    """
    Backend returns 422 because provider_id=None and provider_email=None
    -> Pydantic validation error BEFORE hitting route
    """
    payload = {
        "patient_name": "Nobody",
        "date": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "appointment_type": "Consultation",
        "status": "Scheduled",
        "hospital_name": "UzaziSafe Health Center",
        "provider_id": None,
        "provider_email": None,
    }

    res = client.post("/appointments/book", json=payload)
    assert res.status_code == 422


def test_put_appointments_status__invalid_status_rejected(client, db_session):
    prov = models.User(
        full_name="Dr Bad",
        email="bad@app.com",
        hashed_password="hash",
        is_provider=True,
        hospital_name="UzaziSafe Health Center",
    )
    db_session.add(prov)

    appt = models.Appointment(
        patient_name="Patty",
        date=datetime.utcnow(),
        appointment_type="X",
        status="Scheduled",
        hospital_name="UzaziSafe Health Center",
        provider_id=prov.id,
    )
    db_session.add(appt)
    db_session.commit()

    res = client.put(f"/appointments/{appt.id}/status", json={"status": "NotAllowed"})
    assert res.status_code == 400
