import { useState, useEffect } from "react";
import {
  Activity,
  Calendar,
  TrendingUp,
  LogOut,
  User,
  Plus,
  Home,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RiskInsightCard } from "./RiskInsightCard";
import { RiskAnalyticsDashboard } from "./RiskAnalyticsDashboard";
import { AppointmentsDashboard } from "./AppointmentsDashboard";
import { PatientHome } from "./PatientHome";

interface PatientDashboardProps {
  onLogout: () => void;
  user: any;
}

interface HealthData {
  age: string;
  systolicBP: string;
  diastolicBP: string;
  bloodSugar: string;
  bodyTemp: string;
  heartRate: string;
  previous_complications: string;
  pre_existing_diabetes: string;
  gestational_diabetes: string;
}

async function predictRisk(data: HealthData): Promise<any> {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const payload = {
      Age: parseInt(data.age),
      Systolic_BP: parseFloat(data.systolicBP),
      Diastolic_BP: parseFloat(data.diastolicBP),
      Blood_Sugar: parseFloat(data.bloodSugar),
      Body_Temp: parseFloat(data.bodyTemp),
      Heart_Rate: parseFloat(data.heartRate),
      Previous_Complications: data.previous_complications,
      Pre_existing_Diabetes: data.pre_existing_diabetes,
      Gestational_Diabetes: data.gestational_diabetes,
    };

    const response = await fetch("http://127.0.0.1:8000/assess-risk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Prediction request failed:", error);
    alert("Prediction failed — please make sure your FastAPI backend is running.");
    return null;
  }
}

export function PatientDashboard({ onLogout, user }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState("home");
  const [historyUpdated, setHistoryUpdated] = useState(0);
  const [patientData, setPatientData] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  const [healthData, setHealthData] = useState<HealthData>({
    age: "",
    systolicBP: "",
    diastolicBP: "",
    bloodSugar: "",
    bodyTemp: "",
    heartRate: "",
    previous_complications: "",
    pre_existing_diabetes: "",
    gestational_diabetes: "",
  });
  const [prediction, setPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingPatient, setExistingPatient] = useState<boolean>(false);

  // ✅ Fetch patient data from backend
  useEffect(() => {
    const fetchPatientData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoadingPatient(false);
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/patients/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch patient data");
        const data = await res.json();
        setPatientData(data);
      } catch (err) {
        console.error("❌ Error fetching patient data:", err);
      } finally {
        setLoadingPatient(false);
      }
    };

    fetchPatientData();
  }, []);

  // ✅ Auto-fill static data from backend (and normalize Yes/No)
  useEffect(() => {
    if (patientData) {
      const normalize = (val: string | null | undefined) => {
        if (!val) return "";
        const clean = val.toString().trim().toLowerCase();
        if (clean === "yes") return "Yes";
        if (clean === "no") return "No";
        return "";
      };

      setHealthData({
        age: patientData.age || "",
        pre_existing_diabetes: normalize(patientData.pre_existing_diabetes),
        gestational_diabetes: normalize(patientData.gestational_diabetes),
        previous_complications: normalize(patientData.previous_complications),
        systolicBP: "",
        diastolicBP: "",
        bloodSugar: "",
        bodyTemp: "",
        heartRate: "",
      });

      if (
        patientData.age ||
        patientData.pre_existing_diabetes ||
        patientData.gestational_diabetes ||
        patientData.previous_complications
      ) {
        setExistingPatient(true);
      }
    }
  }, [patientData]);

  const handleInputChange = (field: keyof HealthData, value: string) => {
    setHealthData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPrediction(null);

    if (!patientData) {
      alert("Patient data not loaded. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    const result = await predictRisk(healthData);

    if (result) {
      setPrediction(result);

      const riskPrediction =
        result.Prediction ||
        result.predicted_class ||
        result.prediction ||
        "Low Risk";

      const riskProbability =
        result.High_Risk_Probability ||
        result.high_risk_probability ||
        result.probability ||
        0;

      const history = JSON.parse(localStorage.getItem("riskHistory") || "[]");
      const newRecord = {
        ...healthData,
        result: {
          Prediction: riskPrediction,
          High_Risk_Probability: riskProbability,
        },
        timestamp: new Date().toISOString(),
        userEmail: patientData?.email || "unknown",
      };
      history.push(newRecord);
      localStorage.setItem("riskHistory", JSON.stringify(history));

      setHistoryUpdated((prev) => prev + 1);
    }
// ✅ Save static info after first prediction
if (!existingPatient) {
  try {
    const token = localStorage.getItem("token");
    await fetch("http://127.0.0.1:8000/patients/update-static-info", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        age: healthData.age,
        pre_existing_diabetes: healthData.pre_existing_diabetes,
        gestational_diabetes: healthData.gestational_diabetes,
        previous_complications: healthData.previous_complications,
      }),

    });
    setExistingPatient(true); // lock fields immediately
  } catch (error) {
    console.error("Failed to update static info:", error);
  }
}


    setIsLoading(false);
  };

  if (loadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-screen text-indigo-700">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-700 to-indigo-700 text-white flex flex-col shadow-lg">
        <div className="p-6 border-b border-indigo-500/50 bg-indigo-700/90 flex flex-col items-center text-center">
          <Plus className="w-8 h-8 text-blue-200 mb-2" strokeWidth={3} />
          <h1 className="text-3xl font-extrabold text-white tracking-wide">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">
              UzaziSafe
            </span>
          </h1>
          <p className="text-sm text-indigo-200 mt-1 font-semibold uppercase tracking-widest">
            Patient Portal
          </p>
        </div>

        {/* ✅ User info */}
        <div className="px-6 py-4 border-b border-indigo-500/30 flex items-center gap-3 bg-blue-600/20">
          <User className="w-5 h-5 text-indigo-200" />
          <div>
            <p className="font-medium text-sm">
              {patientData?.full_name || "Patient"}
            </p>
            <p className="text-xs text-indigo-200">{patientData?.email || ""}</p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "home", icon: Home, label: "Home Overview" },
            { id: "assessment", icon: Activity, label: "Risk Assessment" },
            { id: "history", icon: TrendingUp, label: "History" },
            { id: "appointments", icon: Calendar, label: "Appointments" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center w-full px-4 py-2 rounded-lg text-left transition ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-indigo-100 hover:bg-blue-600/50"
              }`}
            >
              <tab.icon className="w-5 h-5 mr-3" />
              {tab.label}
            </button>
          ))}

          <div className="pt-4 mt-6 border-t border-indigo-500/40">
            <Button
              variant="outline"
              onClick={onLogout}
              className="w-full border-white/40 text-white hover:bg-blue-600 transition"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === "home" && (
          <div className="max-w-5xl mx-auto">
            <PatientHome
              user={patientData}
              onAssessRisk={() => setActiveTab("assessment")}
            />
          </div>
        )}

        {activeTab === "assessment" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-semibold text-blue-700">
              Risk Assessment
            </h2>
            <p className="text-gray-600">
              Enter your health details below to assess your maternal risk level.
            </p>

            <form
              onSubmit={handlePredict}
              className="grid grid-cols-1 gap-6 bg-white p-6 rounded-xl shadow"
            >
              {/* Static fields */}
              <div className="space-y-2">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  required
                  value={healthData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  disabled={existingPatient}
                />
              </div>

              {/* Vitals */}
              <div className="space-y-2">
                <Label>Blood Pressure (mmHg)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="systolicBP" className="text-sm text-gray-600">
                      Systolic
                    </Label>
                    <Input
                      id="systolicBP"
                      type="number"
                      required
                      value={healthData.systolicBP}
                      onChange={(e) =>
                        handleInputChange("systolicBP", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="diastolicBP" className="text-sm text-gray-600">
                      Diastolic
                    </Label>
                    <Input
                      id="diastolicBP"
                      type="number"
                      required
                      value={healthData.diastolicBP}
                      onChange={(e) =>
                        handleInputChange("diastolicBP", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodSugar">Blood Sugar (mmol/L)</Label>
                <Input
                  id="bloodSugar"
                  type="number"
                  required
                  value={healthData.bloodSugar}
                  onChange={(e) =>
                    handleInputChange("bloodSugar", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyTemp">Body Temperature (°F)</Label>
                <Input
                  id="bodyTemp"
                  type="number"
                  required
                  value={healthData.bodyTemp}
                  onChange={(e) => handleInputChange("bodyTemp", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input
                  id="heartRate"
                  type="number"
                  required
                  value={healthData.heartRate}
                  onChange={(e) => handleInputChange("heartRate", e.target.value)}
                />
              </div>

              {[
                { id: "previous_complications", label: "Previous Complications" },
                { id: "pre_existing_diabetes", label: "Pre-existing Diabetes" },
                { id: "gestational_diabetes", label: "Gestational Diabetes" },
              ].map((f) => (
                <div key={f.id} className="space-y-2">
                  <Label htmlFor={f.id}>{f.label}</Label>
                  <select
                    id={f.id}
                    required
                    disabled={existingPatient}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    value={healthData[f.id as keyof HealthData]}
                    onChange={(e) =>
                      handleInputChange(f.id as keyof HealthData, e.target.value)
                    }
                  >
                    <option value="" disabled hidden>
                      Select an option
                    </option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              ))}

              <div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-indigo-700 text-white"
                >
                  {isLoading ? "Analyzing..." : "Predict Risk Level"}
                </Button>
              </div>
            </form>

            {isLoading && (
              <Card className="mt-6 text-center py-8">
                <CardContent>
                  <div className="mx-auto w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-blue-700 font-semibold">
                    Analyzing your data...
                  </p>
                </CardContent>
              </Card>
            )}

            {prediction && !isLoading && (
              <RiskInsightCard result={prediction?.risk_result || prediction} formData={healthData} />
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-5xl mx-auto">
            <RiskAnalyticsDashboard
              refreshKey={historyUpdated}
              userEmail={patientData?.email || ""}
            />
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="max-w-5xl mx-auto">
            <AppointmentsDashboard userEmail={patientData?.email || ""} />
          </div>
        )}
      </main>
    </div>
  );
}
