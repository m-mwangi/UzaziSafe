# ml/predictor.py
import joblib
import numpy as np
import shap
import pandas as pd
import os


# ==========================================================
# ✅ Load Model and SHAP Explainer
# ==========================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "xgboost_model.pkl")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

model = joblib.load(MODEL_PATH)

# SHAP explainer initialization
try:
    explainer = shap.TreeExplainer(model)
except Exception as e:
    print(f"⚠️ Warning: SHAP explainer initialization failed — {e}")
    explainer = None


# ==========================================================
# ✅ Utility: Safe float conversion
# ==========================================================
def safe_float(value, default=0.0):
    try:
        if value is None or str(value).lower() in ["nan", "none", "null"]:
            return default
        return float(value)
    except Exception:
        return default


# ==========================================================
# ✅ Main Risk Assessment Function
# ==========================================================
def assess_risk(data: dict):
    """
    Takes patient health data as a dict and returns:
    - Prediction label ("High Risk" / "Low Risk")
    - High / Low risk probabilities
    - SHAP feature contributions
    """

    mapping = {"Yes": 1, "No": 0}

    # --- Convert and sanitize inputs ---
    try:
        prev_comp = mapping.get(data.get("Previous_Complications", "No"), 0)
        pre_diab = mapping.get(data.get("Pre_existing_Diabetes", "No"), 0)
        gest_diab = mapping.get(data.get("Gestational_Diabetes", "No"), 0)

        X_input = pd.DataFrame([{
            "Age": safe_float(data.get("Age")),
            "Systolic BP": safe_float(data.get("Systolic_BP")),
            "Diastolic BP": safe_float(data.get("Diastolic_BP")),
            "Blood Sugar": safe_float(data.get("Blood_Sugar")),
            "Body Temp": safe_float(data.get("Body_Temp")),
            "Heart Rate": safe_float(data.get("Heart_Rate")),
            "Previous Complications": prev_comp,
            "Pre-existing Diabetes": pre_diab,
            "Gestational Diabetes": gest_diab,
        }])
    except Exception as e:
        raise ValueError(f"❌ Invalid input data: {e}")

    # --- Model Prediction ---
    try:
        pred = model.predict(X_input)[0]
        probs = model.predict_proba(X_input)
    except Exception as e:
        raise RuntimeError(f"❌ Model prediction failed: {e}")

    # --- Normalize probability shape ---
    high_prob = 0.0
    low_prob = 0.0

    if isinstance(probs, (list, np.ndarray)):
        probs = np.array(probs)
        if probs.ndim == 2 and probs.shape[1] >= 2:
            low_prob = safe_float(probs[0][0])
            high_prob = safe_float(probs[0][1])
        elif probs.ndim == 1:
            high_prob = safe_float(probs[0])
            low_prob = safe_float(1 - high_prob)
    else:
        high_prob = safe_float(probs)
        low_prob = safe_float(1 - high_prob)

    risk_label = "High Risk" if int(pred) == 1 else "Low Risk"

    # --- SHAP Values for Explainability ---
    try:
        if explainer is not None:
            shap_values = explainer.shap_values(X_input)
            shap_values = np.array(shap_values)
            if shap_values.ndim == 2:
                shap_values = shap_values[0]
            elif shap_values.ndim == 3:
                shap_values = shap_values[0][0]

            feature_names = list(X_input.columns)
            feature_impacts = {
                feature: float(np.round(value, 4))
                for feature, value in zip(feature_names, shap_values)
            }

            # Sort by absolute impact
            sorted_impacts = dict(
                sorted(feature_impacts.items(), key=lambda x: abs(x[1]), reverse=True)
            )
        else:
            sorted_impacts = {}
    except Exception as e:
        print(f"⚠️ SHAP computation skipped due to error: {e}")
        sorted_impacts = {}

    # --- Logging for debugging ---
    print("✅ assess_risk() completed successfully.")
    print({
        "Prediction": risk_label,
        "High_Risk_Probability": high_prob,
        "Low_Risk_Probability": low_prob,
    })

    # --- Return JSON-safe dictionary ---
    return {
        "Prediction": risk_label,
        "High_Risk_Probability": round(high_prob, 3),
        "Low_Risk_Probability": round(low_prob, 3),
        "Top_Contributing_Factors": sorted_impacts,
    }
