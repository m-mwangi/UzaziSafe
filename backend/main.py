# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from backend import models
from backend.database import engine
from backend.routes import patients, appointments, auth, provider, risk_assess
import joblib
import shap

# ==========================================================
# Create Database Tables
# ==========================================================
models.Base.metadata.create_all(bind=engine)

# ==========================================================
# Initialize FastAPI app
# ==========================================================
app = FastAPI(
    title="UzaziSafe API",
    description="Backend API for the UzaziSafe maternal health system",
    version="1.0.0",
)

# ==========================================================
# CORS Settings
# ==========================================================
origins = [
    "http://localhost:5173",  # Local Vite frontend
    "http://localhost:3000",  # Local CRA frontend
    "https://uzazisafe-frontend.onrender.com",  # Deployed frontend (Render)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# Load Machine Learning Model (optional)
# ==========================================================
try:
    model = joblib.load("backend/xgboost_model.pkl")
    explainer = shap.TreeExplainer(model)
    print("Model loaded successfully.")
except Exception as e:
    print(" Model could not be loaded:", e)

# ==========================================================
# Root endpoint
# ==========================================================
@app.get("/")
def home():
    return {"message": "UzaziSafe Backend is running successfully 🚀"}

# ==========================================================
# Include Routers
# ==========================================================
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(appointments.router)
app.include_router(provider.router)
app.include_router(risk_assess.router)

# ==========================================================
# Add Bearer Token Authorization in Swagger
# ==========================================================
def custom_openapi():
    """
    Ensures Swagger UI shows and applies Bearer token globally
    """
    if app.openapi_schema:
        del app.openapi_schema  # Force refresh schema each time
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Paste access token here (no 'Bearer ' prefix needed)"
        }
    }

    # Apply security to all endpoints
    for path, methods in openapi_schema["paths"].items():
        for method in methods.values():
            method["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi
