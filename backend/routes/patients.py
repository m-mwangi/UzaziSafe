# routes/patients.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from .. import models, schemas
from ..database import get_db
from ..utils import get_current_user

router = APIRouter(prefix="/patients", tags=["Patients"])


# ==========================================================
# ✅ Patient Dashboard (Logged-in Patient)
# ==========================================================
@router.get("/me", response_model=schemas.PatientDashboardResponse)
def get_logged_in_patient(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the logged-in patient's dashboard data."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if current_user.is_provider:
        raise HTTPException(status_code=403, detail="Providers cannot access patient dashboard")

    patient = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    provider_name = "Unassigned"
    provider_id = None
    if patient.provider_id:
        provider = db.query(models.User).filter(models.User.id == patient.provider_id).first()
        if provider:
            provider_name = provider.full_name
            provider_id = provider.id

    last_risk = (
        db.query(models.RiskHistory)
        .filter(models.RiskHistory.patient_id == patient.id)
        .order_by(models.RiskHistory.created_at.desc())
        .first()
    )

    next_appt = (
        db.query(models.Appointment)
        .filter(
            and_(
                models.Appointment.patient_name == patient.full_name,
                models.Appointment.status == "Scheduled",
                models.Appointment.date > datetime.utcnow(),
            )
        )
        .order_by(models.Appointment.date.asc())
        .first()
    )

    next_appt_str = next_appt.date.isoformat() if next_appt else None

    return {
        "patient_id": patient.id,   # ✅ new
        "full_name": patient.full_name,
        "email": current_user.email,
        "hospital_name": patient.hospital_name,
        "provider_name": provider_name,
        "provider_id": provider_id,
        "current_risk_level": last_risk.risk_level if last_risk else "Unknown",
        "last_assessment_date": last_risk.created_at if last_risk else None,
        "next_appointment": next_appt_str,
        "age": patient.age if patient.age is not None else None,
        "pre_existing_diabetes": patient.pre_existing_diabetes or "",
        "gestational_diabetes": patient.gestational_diabetes or "",
        "previous_complications": patient.previous_complications or "",
    }


# ==========================================================
# ✅ Update Static Info (for Patients)
# ==========================================================
@router.patch("/update-static-info")
def update_static_info(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Store static patient info (age + categorical features)."""
    if current_user.is_provider:
        raise HTTPException(status_code=403, detail="Providers cannot update patient info")

    patient = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.age = data.get("age", patient.age)
    patient.pre_existing_diabetes = data.get("pre_existing_diabetes", patient.pre_existing_diabetes)
    patient.gestational_diabetes = data.get("gestational_diabetes", patient.gestational_diabetes)
    patient.previous_complications = data.get("previous_complications", patient.previous_complications)

    db.commit()
    db.refresh(patient)
    return {"message": "Patient static info updated", "patient_id": patient.id}


# ==========================================================
# ✅ NEW: Get Latest Risk Record (For Provider View)
# ==========================================================
@router.get("/{patient_id}/latest-risk")
def get_latest_patient_risk(patient_id: int, db: Session = Depends(get_db)):
    record = (
        db.query(models.RiskHistory)
        .filter(models.RiskHistory.patient_id == patient_id)
        .order_by(models.RiskHistory.created_at.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No risk record found")

    # ✅ include patient relationship if defined
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()

    try:
        factors = json.loads(record.contributing_factors.replace("'", '"'))
    except Exception:
        factors = {}

    return {
        "risk_level": record.risk_level,
        "high_risk_probability": record.high_risk_probability,
        "low_risk_probability": record.low_risk_probability,
        "contributing_factors": factors,
        "created_at": record.created_at,
        "vitals": {
            "systolic": record.systolic_bp,
            "diastolic": record.diastolic_bp,
            "bloodSugar": record.blood_sugar,
            "bodyTemp": record.body_temp,
            "heartRate": record.heart_rate,
        },
        # ✅ new block: patient info
        "patient_info": {
            "age": patient.age if patient else None,
            "gestational_diabetes": patient.gestational_diabetes if patient else None,
            "pre_existing_diabetes": patient.pre_existing_diabetes if patient else None,
            "previous_complications": patient.previous_complications if patient else None,
        },
    }
