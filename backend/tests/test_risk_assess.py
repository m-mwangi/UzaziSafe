# backend/tests/test_risk_assess.py
from datetime import datetime
from backend import models
import backend.routes.risk_assess as risk_routes


def test_post_assess_risk__and_get_patient_history(client, db_session, auth_header_for_user, monkeypatch):
    headers, user = auth_header_for_user(
        email="risk@patient.com",
        is_provider=False,
        full_name="Risky",
    )

    patient = models.Patient(
        full_name="Risky",
        age=30,
        hospital_name="UzaziSafe Health Center",
        user_id=user.id,
        risk_level="Unknown",
    )
    db_session.add(patient)
    db_session.commit()

    # Mock ML
    def fake(data):
        return {
            "Prediction": "High Risk",
            "High_Risk_Probability": 0.88,
            "Low_Risk_Probability": 0.12,
            "Top_Contributing_Factors": {"Age": 30},
        }

    monkeypatch.setattr(risk_routes, "assess_risk", fake)

    body = {
        "Age": 30,
        "Systolic_BP": 120,
        "Diastolic_BP": 80,
        "Blood_Sugar": 5.1,
        "Body_Temp": 36.5,
        "Heart_Rate": 80,
    }

    r = client.post("/assess-risk/", json=body, headers=headers)
    assert r.status_code == 200
    rec = r.json()
    assert rec["risk_result"]["Prediction"] == "High Risk"

    hist = client.get(f"/assess-risk/patient/{patient.id}")
    assert hist.status_code == 200
    assert len(hist.json()) >= 1


def test_post_assess_risk__forbidden_for_provider(client, auth_header_for_user):
    headers, _ = auth_header_for_user(
        email="prov_risk@example.com",
        is_provider=True,
        full_name="Prov",
        role="Doctor",
    )

    body = {
        "Age": 30,
        "Systolic_BP": 120,
        "Diastolic_BP": 80,
        "Blood_Sugar": 5.1,
        "Body_Temp": 36.5,
        "Heart_Rate": 80,
    }

    res = client.post("/assess-risk/", json=body, headers=headers)
    assert res.status_code == 403


def test_post_assess_risk__unauthenticated(client):
    body = {
        "Age": 30,
        "Systolic_BP": 120,
        "Diastolic_BP": 80,
        "Blood_Sugar": 5.1,
        "Body_Temp": 36.5,
        "Heart_Rate": 80,
    }
    assert client.post("/assess-risk/", json=body).status_code == 403

def test_get_assess_risk_patient__404_when_no_assessments(client):
    assert client.get("/assess-risk/patient/9999").status_code == 404
