# UzaziSafe - Maternal Health Risk Prediction System
UzaziSafe is a full-stack maternal health monitoring and risk prediction system designed to support safe pregnancies through machine-learning–powered clinical decision support. The system enables real-time maternal health risk prediction, digital appointment management, and provider dashboards for patient monitoring.

## Deployed Frontend
https://uzazisafe.onrender.com

## Deployed Backend
https://uzazisafe-backend.onrender.com

## Demo Video
https://youtu.be/XpEopQAwQ-Q

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
### Clone the Repository
```bash
git clone https://github.com/m-mwangi/UzaziSafe.git
cd UzaziSafe
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Run the FastAPI App
```bash
uvicorn app:main --reload
```
Once running, open:
http://127.0.0.1:8000/docs


### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Patient Dashboard

**Signup/Sign in**
<img width="1836" height="969" alt="image" src="https://github.com/user-attachments/assets/c136dfa3-99e7-47d0-8e8e-0c99c914346f" />

**HomePage**
<img width="1919" height="851" alt="image" src="https://github.com/user-attachments/assets/022fc44c-b610-42f1-85fc-c666cff573a8" />

**Risk Assessment Form**
<img width="906" height="963" alt="image" src="https://github.com/user-attachments/assets/a7b51043-df8b-4355-95f7-d2d28eda6328" />

**App0intment Manager**
<img width="1124" height="865" alt="image" src="https://github.com/user-attachments/assets/076d31cc-8c34-4ef6-88de-06eabbcc2772" />


### Provider Dashboard

**HomePage**
<img width="1872" height="979" alt="image" src="https://github.com/user-attachments/assets/36f8a205-0582-41f6-83c7-2d656aedd699" />

**Patient Management**
<img width="999" height="998" alt="image" src="https://github.com/user-attachments/assets/527624f6-7900-4876-b3ed-cefc5baa0123" />

**Risk Analytics**
<img width="1509" height="1006" alt="image" src="https://github.com/user-attachments/assets/e91dd2c8-8c3e-4054-87f3-080c98e026e0" />


## Testing
**Automated Testing (pytest)**

Coverage includes:
- Authentication & JWT
- Patient & provider routes
- Appointment scheduling
- ML risk predictions
- Utility functions

To run tests:
```bash
pytest -v
```

**Load Testing (Locust)**

Tests simulated:
- Login + token generation
- Patient dashboard access
- Risk prediction requests
- Appointment retrieval

Run:
```bash
locust -f locustfile.py
```

Find more details on the testing here: https://github.com/m-mwangi/UzaziSafe/tree/main/backend/tests

## Author
Marion Wandia Mwangi

m.mwangi2@alustudent.com

Final Year Capstone Project (2025)

African Leadership University
