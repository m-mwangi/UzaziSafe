# UzaziSafe - Maternal Health Risk Prediction System
UzaziSafe is a full-stack maternal health monitoring and risk prediction system designed to support safe pregnancies through machine-learning–powered clinical decision support. The system enables real-time maternal health risk prediction, digital appointment management, and provider dashboards for patient monitoring.

## Features:
**For Patients**
- Perform maternal risk self-assessments.
- View personalized risk insights with SHAP explainability.
- Track risk history and health trends.
- Book and manage appointments.
- Secure authentication with JWT.

**For Healthcare Providers**
- View caseload overview and high-risk patient flags.
- Access patient summaries and detailed history.
- Manage appointments.
- Review risk analytics and trends.

### Machine Learning
- XGBoost model trained to classify pregnancies as "High Risk" or "Low Risk".
- SHAP explanations for transparent clinical interpretation.
- Test accuracy: **90.4%** and ROC-AUC: **0.965**.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + TailwindCSS |
| Backend API | FastAPI (Python) |
| Database | PostgreSQL (Neon Tech) |
| ML Model | XGBoost + SHAP |
| Authentication | JWT + bcrypt |

📌 *(Insert system architecture diagram here)*

---




## 📦 Project Structure
uzazi-safe/
 ├── backend/
 │   ├── app/
 │   │   ├── models/         # SQLAlchemy ORM models
 │   │   ├── schemas/        # Pydantic validation schemas
 │   │   ├── routes/         # FastAPI endpoints
 │   │   ├── ml/             # XGBoost model + SHAP
 │   │   ├── core/           # Auth, config, utils
 │   │   └── main.py         # API entrypoint
 ├── frontend/
 │   ├── src/
 │   │   ├── pages/          # Screens (Dashboards, Login, Risk Assessment)
 │   │   ├── components/     # UI components
 │   │   └── api/            # Axios API service
 ├── tests/                  # pytest automated tests
 └── README.md


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
