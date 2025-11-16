# UzaziSafe - Maternal Health Risk Prediction System
UzaziSafe is a full-stack maternal health monitoring and risk prediction system designed to support safe pregnancies through machine-learning–powered clinical decision support. The system enables real-time maternal health risk prediction, digital appointment management, and provider dashboards for patient monitoring.

## Features
**For Patients:**
- Perform maternal risk self-assessments.
- View personalized risk insights with SHAP explainability.
- Track risk history and health trends.
- Book and manage appointments.
- Secure authentication with JWT.

**For Healthcare Providers:**
- View caseload overview and high-risk patient flags.
- Access patient summaries and detailed history.
- Manage appointments.
- Review risk analytics and trends.

## Machine Learning
- XGBoost model trained to classify pregnancies as "High Risk" or "Low Risk".
- SHAP explanations for transparent clinical interpretation.
- Test accuracy: **90.4%** and ROC-AUC: **0.965**.

## System Architecture

The platform follows a modular architecture consisting of the following layers:

| Layer        | Technology                            | Responsibility |
|--------------|----------------------------------------|----------------|
| Frontend     | React + TypeScript + TailwindCSS      | Role-based dashboards (Patient & Provider) |
| Backend API  | FastAPI (Python)                      | Authentication, risk assessment, appointments, providers |
| Database     | PostgreSQL (Neon Tech)                | Persistent storage (users, risk histories, appointments) |
| ML Model     | XGBoost + SHAP                        | Risk prediction & interpretability |
| Auth         | JWT + bcrypt                          | Secure access control |


## Project Structure
```
UzaziSafe/
├── backend/                     # FastAPI backend (API, ML inference, database)
├── frontend/                    # React + TypeScript web client
├── models/                      # Trained ML models.
├── notebook/                    # Notebook for model implementation
├── Maternal Health Data.csv     # Dataset used for model development
├── test.db                      # Local development/test database
├── pytest.ini                   # Test configuration
└── README.md                    # Project documentation
```

## Environment Setup and Project Installation

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```




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
