from fastapi import APIRouter, Depends, HTTPException, Form, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from passlib.context import CryptContext
from jose import jwt, JWTError

from .. import models, schemas
from ..database import get_db
from ..utils import create_access_token, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# LOGIN BODY MODEL
class LoginRequest(BaseModel):
    email: str
    password: str

# PROVIDER SIGNUP
@router.post("/signup/provider", response_model=schemas.UserResponse)
def signup_provider(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    hospital_name: schemas.HospitalName = Form(...),
    role: str = Form(...),
    db: Session = Depends(get_db),
):
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = pwd_context.hash(password)

    new_user = models.User(
        full_name=full_name,
        email=email,
        hashed_password=hashed_pw,
        is_provider=True,
        hospital_name=hospital_name.value,
        role=role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# PATIENT SIGNUP
@router.post("/signup/patient", response_model=schemas.UserResponse)
def signup_patient(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    hospital_name: schemas.HospitalName = Form(...),
    db: Session = Depends(get_db),
):
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = pwd_context.hash(password)
    new_user = models.User(
        full_name=full_name,
        email=email,
        hashed_password=hashed_pw,
        is_provider=False,
        hospital_name=hospital_name.value,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    assigned_doctor = (
        db.query(models.User)
        .filter(models.User.hospital_name == hospital_name.value, models.User.is_provider == True)
        .order_by(func.random())
        .first()
    )

    new_patient = models.Patient(
        full_name=new_user.full_name,
        user_id=new_user.id,
        provider_id=assigned_doctor.id if assigned_doctor else None,
        hospital_name=hospital_name.value,
        risk_level="Unknown",
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return {
        "id": new_user.id,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "hospital_name": new_user.hospital_name,
        "is_provider": new_user.is_provider,
        "assigned_doctor": assigned_doctor.full_name if assigned_doctor else None,
        "created_at": new_user.created_at,
    }

# LOGIN
@router.post("/login")
async def login(
    request: Request,
    db: Session = Depends(get_db),
    email: str = Form(None),
    password: str = Form(None),
):
    data = None
    try:
        data = await request.json()
    except Exception:
        pass

    if not email and data:
        email = data.get("email")
        password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user or not pwd_context.verify(password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": db_user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_provider": db_user.is_provider,
        "role": db_user.role,
        "hospital_name": db_user.hospital_name,
        "full_name": db_user.full_name,
        "email": db_user.email,
    }
