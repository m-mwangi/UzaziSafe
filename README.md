# UzaziSafe - Maternal Health Risk Prediction System

## Project Description
This project is an ML-powered maternal health prediction system that classifies patients as either **High Risk** or **Low Risk** based on key clinical indicators such as:
- Age
- Diastolic BP
- Systolic BP
- Blood Sugar
- Body Temperature
- Previous Complications
- Gestational Diabetes
- Pre-existing Diabetes
- Heart Rate

The solution integrates a Machine Learning pipeline (data preprocessing → model training → evaluation → deployment) and serves predictions in real time through a FastAPI application.  
The **XGBoost model** achieved the best performance and was selected for deployment.

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
