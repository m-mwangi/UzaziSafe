## Testing Overview
The UzaziSafe system underwent extensive unit, integration, and performance testing to ensure backend reliability, data integrity, and correct behavior of core clinical features.

### Unit & Integration Testing
Testing was conducted using pytest and FastAPI’s TestClient, combining:
- Unit tests → validation of individual functions and logic
- Integration tests → full API + database + authentication workflows

Key features tested:
- Component	Validated Functionality
- Authentication & Security	User registration & login, password hashing, JWT verification, role-based access control, invalid credentials handling
- Patient Module	Dashboard retrieval, risk history access, appointment listing, prevention of unauthorized data access
- Provider Module	Assigned patient retrieval, risk analytics, appointment views, restricted access for non-provider roles
- Appointments System	Booking, updating, and listing appointments, validation errors, status management
- Risk Assessment (XGBoost + SHAP)	Prediction output, probability scores, SHAP explanations, history storage, secure access control
- Utility Functions	Token creation, password hashing & verification correctness

All backend tests were executed against a dedicated test database to ensure reproducible, isolated results. The system demonstrated stable and correct behavior across all valid and erroneous input scenarios.
<img width="1479" height="707" alt="image" src="https://github.com/user-attachments/assets/bae8f475-6913-41d2-861f-0920f34595bb" />

### Performance Testing
Performance testing was conducted with Locust, simulating 10 concurrent virtual users repeatedly performing:
- Logging in & session validation
- Retrieving dashboards
- Submitting risk assessment requests (ML inference)
- Viewing appointment history

Results:
- Metric	Result
- Failed requests	0
- Dashboard response median latency	< 1 second
- Risk assessment latency	Slightly higher but within acceptable range
- Authentication performance	Stable and consistent under load
- Load spike handling	No crashes, no dropped requests

The system showed strong resilience during concurrency testing, indicating suitability for pilot deployment.
<img width="948" height="455" alt="image" src="https://github.com/user-attachments/assets/a3f7dbef-ffaa-47d1-8ca4-517f8fcb81bc" />


### Limitations
- ML models used publicly available datasets due to ethical and data access constraints; may not fully represent Kenyan maternal health profiles.
- Tests ran in a controlled environment; real-world performance with hospital infrastructure may differ.
- Load tests simulated a limited number of users; more extensive testing required for national-scale deployment.
- System optimization for low-bandwidth or offline environments is still needed.
- Usability testing with healthcare workers was limited and should be expanded in future iterations.
