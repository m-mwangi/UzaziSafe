from fastapi import FastAPI
from enum import Enum
import joblib
import numpy as np

# Load model
model = joblib.load("xgboost_model.pkl")

# Define Enums
class YesNo(str, Enum):
    Yes = "Yes"
    No = "No"

# Initialize app
app = FastAPI(
    title="Maternal Health Risk Prediction API",
    description="Predicts maternal health risk (Low/High) using XGBoost model.",
    version="2.0"
)

@app.get("/")
def home():
    return {"message": "Maternal Health Risk Prediction API is running!"}

@app.post("/predict")
def predict(
    Age: int,
    Systolic_BP: float,
    Diastolic_BP: float,
    Blood_Sugar: float,
    Body_Temp: float,
    Heart_Rate: float,
    Previous_Complications: YesNo,
    Pre_existing_Diabetes: YesNo,
    Gestational_Diabetes: YesNo
):
    # Mapping
    mapping = {"Yes": 1, "No": 0}
    prev_comp = mapping[Previous_Complications.value]
    pre_diab = mapping[Pre_existing_Diabetes.value]
    gest_diab = mapping[Gestational_Diabetes.value]

    X = np.array([[Age, Systolic_BP, Diastolic_BP, Blood_Sugar,
                   Body_Temp, Heart_Rate, prev_comp, pre_diab, gest_diab]])

    pred = model.predict(X)[0]
    probs = model.predict_proba(X)[0]
    risk = "High Risk" if pred == 1 else "Low Risk"

    return {
        "Prediction": risk,
        "High_Risk_Probability": round(float(probs[1]), 3),
        "Low_Risk_Probability": round(float(probs[0]), 3)
    }