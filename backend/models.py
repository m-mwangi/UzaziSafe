from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
    func
)
from sqlalchemy.orm import relationship
from .database import Base

# USER MODEL
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_provider = Column(Boolean, default=False)
    role = Column(String, nullable=True)
    hospital_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    patients = relationship(
        "Patient",
        back_populates="provider",
        cascade="all, delete",
        foreign_keys="Patient.provider_id"
    )

    appointments = relationship(
        "Appointment",
        back_populates="provider",
        cascade="all, delete",
        foreign_keys="Appointment.provider_id"
    )

    patient_profile = relationship(
        "Patient",
        back_populates="user",
        uselist=False,
        foreign_keys="Patient.user_id"
    )

# PATIENT MODEL
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    pre_existing_diabetes = Column(String, nullable=True)
    gestational_diabetes = Column(String, nullable=True)
    previous_complications = Column(String, nullable=True)
    risk_level = Column(String, default="Unknown")
    last_assessment_date = Column(DateTime(timezone=True), server_default=func.now())
    hospital_name = Column(String, nullable=False)

    provider_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    provider = relationship("User", back_populates="patients", foreign_keys=[provider_id])

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="patient_profile", foreign_keys=[user_id])

    risk_history = relationship("RiskHistory", back_populates="patient", cascade="all, delete")

    # Added timestamps for tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# APPOINTMENT MODEL
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    appointment_type = Column(String, nullable=True)
    status = Column(String, default="Scheduled")
    hospital_name = Column(String, nullable=True)

    provider_id = Column(Integer, ForeignKey("users.id"))
    provider = relationship("User", back_populates="appointments", foreign_keys=[provider_id])

    # Added timestamps for accurate activity tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# RISK HISTORY MODEL
class RiskHistory(Base):
    __tablename__ = "risk_history"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    risk_level = Column(String)
    high_risk_probability = Column(Float)
    low_risk_probability = Column(Float)
    contributing_factors = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Optional: include vital metrics used during risk analysis
    systolic_bp = Column(Float, nullable=True)
    diastolic_bp = Column(Float, nullable=True)
    blood_sugar = Column(Float, nullable=True)
    body_temp = Column(Float, nullable=True)
    heart_rate = Column(Float, nullable=True)

    patient = relationship("Patient", back_populates="risk_history")
