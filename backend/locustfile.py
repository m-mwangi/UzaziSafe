from locust import HttpUser, task, between
import random

PATIENT_EMAIL = "adrian@gmail.com"
PATIENT_PASSWORD = "1234"
PATIENT_NAME = "adrian"
HOSPITAL = "Medicare Clinic"


class HealthcareUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Ensure test user exists, then log in and store JWT token."""
        response = self.client.post(
            "/auth/login",
            data={"email": PATIENT_EMAIL, "password": PATIENT_PASSWORD}
        )

        if response.status_code != 200:
            print("User missing — creating test patient...")
            signup = self.client.post(
                "/auth/signup/patient",
                data={
                    "full_name": PATIENT_NAME,
                    "email": PATIENT_EMAIL,
                    "password": PATIENT_PASSWORD,
                    "hospital_name": HOSPITAL,
                }
            )

            # Try login again
            response = self.client.post(
                "/auth/login",
                data={"email": PATIENT_EMAIL, "password": PATIENT_PASSWORD}
            )

        # Final check
        try:
            token = response.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {token}"}
        except:
            print("Login failed, response was not JSON:", response.text)
            self.headers = {}

    @task
    def load_patient_dashboard(self):
        """Patient opens dashboard."""
        self.client.get("/patients/me", headers=self.headers)

    @task
    def make_prediction(self):
        """Simulates a risk assessment call."""
        fake_data = {
            "Age": random.randint(20, 40),
            "Systolic_BP": 120,
            "Diastolic_BP": 80,
            "Blood_Sugar": 95,
            "Body_Temp": 37.0,
            "Heart_Rate": 82,
            "Pre_existing_Diabetes": "No",
            "Gestational_Diabetes": "No",
            "Previous_Complications": "No",
        }

        self.client.post(
            "/assess-risk/",
            json=fake_data,
            headers=self.headers,
        )

    @task
    def view_appointments(self):
        """Patient views appointment history."""
        self.client.get(f"/appointments/patient/{PATIENT_EMAIL}", headers=self.headers)
