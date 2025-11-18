import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { PatientSignup } from "./components/PatientSignup";
import { ProviderSignup } from "./components/ProviderSignup";
import { PatientDashboard } from "./components/PatientDashboard";
import { ProviderDashboard } from "./components/ProviderDashboard";
import { Tooltip } from "./components/ui/tooltip";
import { PrivacyPolicy } from "./components/PrivacyPolicy";

function App() {
  const [page, setPage] = useState<
    | "landing"
    | "createPatient"
    | "createProvider"
    | "patient"
    | "provider"
    | "privacyPolicy"
  >("landing");

  const [user, setUser] = useState<any>(null);

  // Load session on startup
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setPage(userData.is_provider ? "provider" : "patient");
    }
  }, []);

  // Handle login & navigation
  const handleLogin = (
    type:
      | "patient"
      | "provider"
      | "createPatient"
      | "createProvider"
      | "privacyPolicy" 
  ) => {
    if (type === "createPatient") {
      setPage("createPatient");
    } else if (type === "createProvider") {
      setPage("createProvider");
    } else if (type === "privacyPolicy") {
      setPage("privacyPolicy");
    } else if (type === "patient" || type === "provider") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setPage(userData.is_provider ? "provider" : "patient");
      } else {
        alert("Login failed — please check your credentials.");
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setPage("landing");
  };

  // Keep Tooltip + Router wrapper
  return (
    <Tooltip.Provider delayDuration={150} skipDelayDuration={300}>
      <BrowserRouter>
        {page === "landing" && <LandingPage onLogin={handleLogin} />}

        {page === "createPatient" && (
          <PatientSignup onBack={() => setPage("landing")} />
        )}

        {page === "createProvider" && (
          <ProviderSignup onBack={() => setPage("landing")} />
        )}

        {page === "privacyPolicy" && (
          <PrivacyPolicy onBack={() => setPage("landing")} />
        )}

        {page === "patient" && (
          <PatientDashboard onLogout={handleLogout} user={user} />
        )}

        {page === "provider" && (
          <ProviderDashboard onLogout={handleLogout} />
        )}
      </BrowserRouter>
    </Tooltip.Provider>
  );
}

export default App;
