from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum

# ==========================================================
# ENUM: HOSPITAL LIST (used in signup dropdown)
# ==========================================================
class HospitalName(str, Enum):
    aga_khan = "Aga Khan Hospital"
    nairobi_women = "Nairobi Women's Hospital"
    medicare = "MediCare Clinic"
    uzazisafe = "UzaziSafe Health Center"


# ==========================================================
# ENUM: PROVIDER ROLE
# ==========================================================
class ProviderRole(str, Enum):
    doctor = "Doctor"
    nurse = "Nurse"
    midwife = "Midwife"


# ==========================================================
# USER SCHEMAS
# ==========================================================
class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    hospital_name: HospitalName
    is_provider: bool = False
    role: Optional[ProviderRole] = None

    class Config:
        use_enum_values = True


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    hospital_name: str
    is_provider: bool
    role: Optional[str] = None
    created_at: datetime
    assigned_doctor: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================================
# PATIENT SCHEMAS
# ==========================================================
class PatientBase(BaseModel):
    full_name: str
    age: Optional[int] = None
    risk_level: Optional[str] = "Unknown"
    hospital_name: str


class PatientCreate(PatientBase):
    provider_id: int


class PatientResponse(PatientBase):
    id: int
    last_assessment_date: Optional[datetime] = None
    provider_id: Optional[int] = None
    assigned_doctor: Optional[str] = None

    class Config:
        from_attributes = True

# ==========================================================
# PATIENT DASHBOARD RESPONSE
# ==========================================================
class PatientDashboardResponse(BaseModel):
    patient_id: int   # ✅ add this
    full_name: str
    email: str
    hospital_name: str
    provider_name: Optional[str] = None
    provider_id: Optional[int] = None
    current_risk_level: str
    last_assessment_date: Optional[datetime] = None
    next_appointment: Optional[str] = None

    # ✅ Add static patient fields so FastAPI returns them
    age: Optional[int] = None
    pre_existing_diabetes: Optional[str] = None
    gestational_diabetes: Optional[str] = None
    previous_complications: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================================
# ✅ PROVIDER DASHBOARD RESPONSE (CORRECTED)
# ==========================================================
class ProviderDashboardResponse(BaseModel):
    provider_id: int
    provider_name: str  # ✅ renamed from full_name
    email: str
    hospital_name: str
    role: str
    total_patients: int
    high_risk_patients: int
    scheduled_appointments: int

    class Config:
        from_attributes = True


# ==========================================================
# APPOINTMENT SCHEMAS
# ==========================================================
class AppointmentBase(BaseModel):
    patient_name: str
    date: datetime
    appointment_type: Optional[str] = None
    status: Optional[str] = "Scheduled"
    hospital_name: Optional[str] = None
    provider_email: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    provider_id: int


class AppointmentResponse(AppointmentBase):
    id: int
    provider_id: Optional[int] = None
    provider_name: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================================
# RISK HISTORY SCHEMAS
# ==========================================================
class RiskHistoryBase(BaseModel):
    risk_level: str
    high_risk_probability: float
    low_risk_probability: float
    contributing_factors: str


class RiskHistoryCreate(RiskHistoryBase):
    patient_id: int


class RiskHistoryResponse(RiskHistoryBase):
    id: int
    patient_id: int
    created_at: datetime

    class Config:
        from_attributes = True
