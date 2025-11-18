from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/appointments", tags=["Appointments"])


# Book Appointment (Patient books with Provider)
@router.post("/book", response_model=schemas.AppointmentResponse)
def book_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    # Locate provider by email OR ID
    provider = None
    if appointment.provider_email:
        provider = db.query(models.User).filter_by(email=appointment.provider_email, is_provider=True).first()
    if not provider and appointment.provider_id:
        provider = db.query(models.User).filter_by(id=appointment.provider_id, is_provider=True).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Find patient profile
    patient_profile = (
        db.query(models.Patient)
        .filter(models.Patient.full_name == appointment.patient_name)
        .first()
    )
    if not patient_profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Create new appointment entry
    hospital_name = appointment.hospital_name or patient_profile.hospital_name
    new_appointment = models.Appointment(
        patient_name=appointment.patient_name,
        date=appointment.date,
        appointment_type=appointment.appointment_type,
        status=appointment.status,
        provider_id=provider.id,
        hospital_name=hospital_name,
    )

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    return new_appointment

# Get all Appointments for a Provider
@router.get("/provider/{email}", response_model=list[schemas.AppointmentResponse])
def get_provider_appointments(email: str, db: Session = Depends(get_db)):
    # Find provider by email
    provider = db.query(models.User).filter_by(email=email, is_provider=True).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Fetch all appointments linked by provider_id
    appointments = (
        db.query(models.Appointment)
        .filter(models.Appointment.provider_id == provider.id)
        .order_by(models.Appointment.date.desc())
        .all()
    )

    # Serialize results safely
    results = []
    for a in appointments:
        results.append({
            "id": a.id,
            "patient_name": a.patient_name,
            "date": a.date,
            "appointment_type": a.appointment_type,
            "status": a.status,
            "hospital_name": a.hospital_name,
            "provider_id": a.provider_id,
            "provider_name": provider.full_name if provider else None,
        })

    return results
    
# Get all Appointments for a Patient
@router.get("/patient/{email}")
def get_patient_appointments(email: str, db: Session = Depends(get_db)):
    # Find patient user
    patient_user = db.query(models.User).filter_by(email=email, is_provider=False).first()
    if not patient_user:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Find patient profile
    patient_profile = (
        db.query(models.Patient)
        .filter(models.Patient.user_id == patient_user.id)
        .first()
    )
    if not patient_profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    # Get appointments with provider info
    appointments = (
        db.query(models.Appointment)
        .options(joinedload(models.Appointment.provider)) 
        .filter(models.Appointment.patient_name == patient_profile.full_name)
        .order_by(models.Appointment.date.desc())
        .all()
    )

    # Serialize results
    results = []
    for a in appointments:
        results.append({
            "id": a.id,
            "patient_name": a.patient_name,
            "date": a.date,
            "appointment_type": a.appointment_type,
            "status": a.status,
            "hospital_name": a.hospital_name or patient_profile.hospital_name,
            "provider_id": a.provider_id,
            "provider_name": a.provider.full_name if a.provider else None,  
        })

    return results


# Update Appointment Status (Completed / Cancelled)
@router.put("/{appointment_id}/status", response_model=schemas.AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
):
    """
    Update appointment status.
    Expected payload:
      { "status": "Completed" } or { "status": "Cancelled" }
    """

    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    new_status = status_update.get("status")
    if new_status not in ["Scheduled", "Completed", "Cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    appointment.status = new_status
    db.commit()
    db.refresh(appointment)
    return appointment
