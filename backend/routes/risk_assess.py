# routes/risk_assess.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from .. import models
from ..database import get_db
from ..ml.predictor import assess_risk
from ..utils import get_current_user
import json

router = APIRouter(prefix="/assess-risk", tags=["Risk Assessment"])


# ==========================================================
# ✅ RUN ASSESSMENT + SAVE RESULT
# ==========================================================
@router.post("/")
def assess_and_store_risk(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Calls ML model → saves risk result → updates patient record → returns result.
    """

    # ✅ Ensure it's a patient user
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if current_user.is_provider:
        raise HTTPException(status_code=403, detail="Providers cannot assess patient risk")

    # ✅ Find the patient's record using user_id
    patient = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # ✅ Save static details ONCE if not already set
    updates = False
    if patient.age is None and "Age" in data and data["Age"] is not None:
        patient.age = data["Age"]
        updates = True

    if patient.pre_existing_diabetes is None and "Pre_existing_Diabetes" in data:
        patient.pre_existing_diabetes = data["Pre_existing_Diabetes"]
        updates = True

    if patient.gestational_diabetes is None and "Gestational_Diabetes" in data:
        patient.gestational_diabetes = data["Gestational_Diabetes"]
        updates = True

    if patient.previous_complications is None and "Previous_Complications" in data:
        patient.previous_complications = data["Previous_Complications"]
        updates = True

    if updates:
        db.commit()
        db.refresh(patient)

    # ✅ Run ML model prediction
    result = assess_risk(data)

    # ✅ Safely get vital values (avoid None or wrong key)
    systolic = float(data.get("Systolic_BP") or 0)
    diastolic = float(data.get("Diastolic_BP") or 0)
    sugar = float(data.get("Blood_Sugar") or 0)
    temp = float(data.get("Body_Temp") or 0)
    heart = float(data.get("Heart_Rate") or 0)

    # ✅ Save to RiskHistory (now including vitals)
    new_risk = models.RiskHistory(
        patient_id=patient.id,
        risk_level=result.get("Prediction"),
        high_risk_probability=result.get("High_Risk_Probability"),
        low_risk_probability=result.get("Low_Risk_Probability"),
        contributing_factors=str(result.get("Top_Contributing_Factors")),
        systolic_bp=systolic,
        diastolic_bp=diastolic,
        blood_sugar=sugar,
        body_temp=temp,
        heart_rate=heart,
    )

    db.add(new_risk)

    # ✅ Update patient summary record
    patient.risk_level = result.get("Prediction")
    patient.last_assessment_date = datetime.utcnow()

    db.commit()
    db.refresh(new_risk)

    return {
        "message": "Risk assessment completed successfully.",
        "risk_result": result,
        "record_id": new_risk.id,
        "patient_id": patient.id,
        "saved_vitals": {
            "systolic_bp": new_risk.systolic_bp,
            "diastolic_bp": new_risk.diastolic_bp,
            "blood_sugar": new_risk.blood_sugar,
            "body_temp": new_risk.body_temp,
            "heart_rate": new_risk.heart_rate,
        },
    }


# ==========================================================
# ✅ GET ALL RISK ASSESSMENTS FOR A PATIENT
# ==========================================================
@router.get("/patient/{patient_id}", tags=["Risk Assessment"])
def get_patient_assessments(patient_id: int, db: Session = Depends(get_db)):
    """
    Fetch all risk assessment history entries for a given patient.
    """
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    assessments = (
        db.query(models.RiskHistory)
        .filter(models.RiskHistory.patient_id == patient.id)
        .order_by(models.RiskHistory.created_at.desc())
        .all()
    )

    if not assessments:
        raise HTTPException(status_code=404, detail="No assessments found")

    return [
        {
            "id": r.id,
            "patientId": r.patient_id,
            "timestamp": r.created_at,
            "risk": r.risk_level,
            "probability_high": r.high_risk_probability,
            "probability_low": r.low_risk_probability,
            "factors": r.contributing_factors,
            "vitals": {
                "systolic_bp": r.systolic_bp,
                "diastolic_bp": r.diastolic_bp,
                "blood_sugar": r.blood_sugar,
                "body_temp": r.body_temp,
                "heart_rate": r.heart_rate,
            },
        }
        for r in assessments
    ]