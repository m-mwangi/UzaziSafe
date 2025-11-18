from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas
from ..database import get_db
from ..utils import get_current_user

router = APIRouter(prefix="/providers", tags=["Providers"])

# GET PROVIDER DASHBOARD OVERVIEW
@router.get("/me", response_model=schemas.ProviderDashboardResponse)
def get_logged_in_provider(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user or not current_user.is_provider:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only providers can access this dashboard",
        )

    # Count patients and appointments
    total_patients = db.query(models.Patient).filter(
        models.Patient.provider_id == current_user.id
    ).count()

    high_risk_patients = (
        db.query(models.Patient)
        .filter(models.Patient.provider_id == current_user.id)
        .filter(models.Patient.risk_level == "High Risk")
        .count()
    )

    scheduled_appointments = (
        db.query(models.Appointment)
        .filter(models.Appointment.provider_id == current_user.id)
        .filter(models.Appointment.status == "Scheduled")
        .count()
    )

    # Return full provider overview
    return {
        "provider_id": current_user.id, 
        "provider_name": current_user.full_name,
        "email": current_user.email,
        "hospital_name": current_user.hospital_name,
        "role": current_user.role or "Provider",
        "total_patients": total_patients,
        "high_risk_patients": high_risk_patients,
        "scheduled_appointments": scheduled_appointments,
    }


# GET LIST OF PATIENTS ASSIGNED TO A PROVIDER (BY ID)
@router.get("/{provider_id}/patients", response_model=list[schemas.PatientResponse])
def get_provider_patients(provider_id: int, db: Session = Depends(get_db)):
    provider = db.query(models.User).filter(
        models.User.id == provider_id, models.User.is_provider == True
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    patients = db.query(models.Patient).filter(
        models.Patient.provider_id == provider.id
    ).all()

    return patients


# GET ALL APPOINTMENTS FOR A PROVIDER (BY ID)
@router.get("/{provider_id}/appointments", response_model=list[schemas.AppointmentResponse])
def get_provider_appointments(provider_id: int, db: Session = Depends(get_db)):
    provider = db.query(models.User).filter(
        models.User.id == provider_id, models.User.is_provider == True
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    appointments = (
        db.query(models.Appointment)
        .filter(models.Appointment.provider_id == provider.id)
        .order_by(models.Appointment.date.asc())
        .all()
    )

    results = []
    for a in appointments:
        results.append({
            "id": a.id,
            "patient_name": a.patient_name,
            "date": a.date,
            "appointment_type": a.appointment_type,
            "status": a.status,
            "hospital_name": a.hospital_name,
            "provider_id": provider.id,
            "provider_name": provider.full_name,
        })

    return results


# GET WEEKLY RISK SUMMARY FOR ALL PATIENTS OF A PROVIDER
@router.get("/{provider_id}/risk-summary")
def get_provider_risk_summary(provider_id: int, db: Session = Depends(get_db)):
    provider = db.query(models.User).filter(
        models.User.id == provider_id,
        models.User.is_provider == True
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Get all patients for this provider
    patients = db.query(models.Patient).filter(
        models.Patient.provider_id == provider.id
    ).all()

    if not patients:
        return {
            "total_assessments": 0,
            "high_risk_count": 0,
            "low_risk_count": 0,
            "avg_risk": 0,
            "weekly": []
        }

    # Collect all risk history entries across patients (last 14 days)
    fourteen_days_ago = datetime.utcnow() - timedelta(days=14)
    history_entries = (
        db.query(models.RiskHistory)
        .join(models.Patient)
        .filter(models.Patient.provider_id == provider.id)
        .filter(models.RiskHistory.created_at >= fourteen_days_ago)
        .all()
    )

    if not history_entries:
        return {
            "total_assessments": 0,
            "high_risk_count": 0,
            "low_risk_count": 0,
            "avg_risk": 0,
            "weekly": []
        }

    # SUMMARY STATS
    total_assessments = len(history_entries)
    high_risk_count = sum(1 for h in history_entries if h.risk_level == "High Risk")
    low_risk_count = sum(1 for h in history_entries if h.risk_level == "Low Risk")
    avg_risk = sum((h.high_risk_probability or 0) for h in history_entries) / total_assessments

    # WEEKLY TREND DATA
    daily_data = {}
    for h in history_entries:
        date_key = h.created_at.date().isoformat()
        if date_key not in daily_data:
            daily_data[date_key] = {"count": 0, "total_prob": 0}
        daily_data[date_key]["count"] += 1
        daily_data[date_key]["total_prob"] += h.high_risk_probability or 0

    weekly_data = []
    for date_str, stats in sorted(daily_data.items()):
        avg_high_prob = stats["total_prob"] / stats["count"]
        weekly_data.append({
            "date": date_str,
            "assessment_count": stats["count"],
            "avg_high_prob": avg_high_prob
        })

    return {
        "total_assessments": total_assessments,
        "high_risk_count": high_risk_count,
        "low_risk_count": low_risk_count,
        "avg_risk": avg_risk,
        "weekly": weekly_data
    }

# GET PROVIDER RECENT ACTIVITY (Dashboard Feed)
@router.get("/{provider_id}/activity")
def get_provider_recent_activity(provider_id: int, db: Session = Depends(get_db)):
    provider = db.query(models.User).filter(
        models.User.id == provider_id,
        models.User.is_provider == True
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    activities = []
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    # Recent Patients Added or Updated
    recent_patients = (
        db.query(models.Patient)
        .filter(models.Patient.provider_id == provider.id)
        .filter(models.Patient.created_at >= seven_days_ago)
        .order_by(models.Patient.created_at.desc())
        .limit(10)
        .all()
    )

    for p in recent_patients:
        activities.append({
            "id": f"patient-{p.id}",
            "icon": "Users",
            "color": "text-indigo-600",
            "text": f"New patient <b>{p.full_name}</b> added to your care list.",
            "time": p.created_at.strftime("%b %d, %Y, %I:%M %p") if p.created_at else ""
        })

    # Risk Updates
    recent_risks = (
        db.query(models.RiskHistory)
        .join(models.Patient)
        .filter(models.Patient.provider_id == provider.id)
        .filter(models.RiskHistory.created_at >= seven_days_ago)
        .order_by(models.RiskHistory.created_at.desc())
        .limit(10)
        .all()
    )

    for r in recent_risks:
        activities.append({
            "id": f"risk-{r.id}",
            "icon": "Activity",
            "color": "text-red-600" if r.risk_level == "High Risk" else "text-green-600",
            "text": f"Risk level updated for <b>{r.patient.full_name}</b> — {r.risk_level}.",
            "time": r.created_at.strftime("%b %d, %Y, %I:%M %p") if r.created_at else ""
        })

    # Appointment Events (Created or Updated)
    recent_appointments = (
        db.query(models.Appointment)
        .filter(models.Appointment.provider_id == provider.id)
        .filter(models.Appointment.updated_at >= seven_days_ago)
        .order_by(models.Appointment.updated_at.desc())
        .limit(10)
        .all()
    )

    for a in recent_appointments:
        # pick updated_at if available, else created_at
        event_time = a.updated_at or a.created_at or a.date
        color = (
            "text-blue-600" if a.status == "Scheduled"
            else "text-yellow-600" if a.status == "Rescheduled"
            else "text-gray-500" if a.status == "Cancelled"
            else "text-green-600"
        )

        activities.append({
            "id": f"appt-{a.id}",
            "icon": "CalendarDays",
            "color": color,
            "text": f"Appointment scheduled with <b>{a.patient_name}</b> — {a.status}.",
            "time": event_time.strftime("%b %d, %Y, %I:%M %p") if event_time else ""
        })

    # Sort all events by time (newest first)
    def sort_key(a):
        try:
            return datetime.strptime(a["time"], "%b %d, %Y, %I:%M %p")
        except Exception:
            return datetime.utcnow()

    activities.sort(key=sort_key, reverse=True)

    # Keep the latest 15 only
    return activities[:5]


# DISCHARGE (DELETE) PATIENT FROM PROVIDER’S CARE
@router.delete("/{provider_id}/patients/{patient_id}", status_code=204)
def discharge_patient(
    provider_id: int,
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Ensure the logged-in provider matches the target provider_id
    if not current_user.is_provider or current_user.id != provider_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to remove this patient."
        )

    patient = (
        db.query(models.Patient)
        .filter(
            models.Patient.id == patient_id,
            models.Patient.provider_id == provider_id,
        )
        .first()
    )

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.delete(patient)
    db.commit()
    return {"message": f"Patient {patient.full_name} discharged successfully"}
