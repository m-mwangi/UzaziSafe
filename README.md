# UzaziSafe - Maternal Health Risk Prediction System

## Project Description
UzaziSafe is a comprehensive maternal health monitoring system that utilizes machine learning to predict pregnancy-related risks and offers digital support to patients and healthcare providers. The system enables:
- Real-time maternal risk prediction using a trained XGBoost model.
- Clinical dashboards for patients and providers.
- Appointments scheduling and patient management.
- Secure authentication using JWT.
- Explainable AI via SHAP feature contributions.
- Scalable FastAPI + PostgreSQL + React architecture.

## GitHub Repository
https://github.com/m-mwangi/UzaziSafe

## Demo Video


## Environment Setup and Project Installation

Follow these steps to set up and run the project locally:

### Clone the Repository
```bash
git clone https://github.com/m-mwangi/UzaziSafe.git
```

### Run the FastAPI App
```bash
uvicorn app:app --reload
```
Once running, open:
http://127.0.0.1:8000/docs

You’ll see an interactive Swagger UI where you can test the prediction endpoint with patient data.

## Deployment Plan
- Local deployment using FastAPI and Uvicorn.
- Model file (xgboost_model.pkl) is loaded for predictions.
- The API accepts clinical input parameters and returns:

```
{
  "Prediction": "High Risk",
  "High_Risk_Probability": 0.87,
  "Low_Risk_Probability": 0.13
}
```

### Future Deployment
- Containerize the app using Docker.
- Deploy on Render.
