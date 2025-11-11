import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Stethoscope } from "lucide-react";

const formatDate = (iso?: string) => {
  if (!iso) return "Not recorded";
  try {
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

interface Patient {
  id: string;
  name?: string;
  fullName?: string;
  age?: number;
  latestRisk?: string;
  notes?: string;
  lastCheck?: string;
  gestationalDiabetes?: string;
  preExistingDiabetes?: string;
  complications?: string;
}

interface RiskRecord {
  risk_level: string;
  high_risk_probability: number;
  low_risk_probability: number;
  contributing_factors: Record<string, number> | string;
  created_at: string;
  vitals?: {
    systolic: number;
    diastolic: number;
    bloodSugar: number;
    heartRate: number;
    bodyTemp: number;
  };
  patient_info?: {
    age?: number;
    gestational_diabetes?: string;
    pre_existing_diabetes?: string;
    previous_complications?: string;
  };
}

export const PatientSummaryModal: React.FC<{
  open: boolean;
  onClose: () => void;
  patient: Patient | null;
}> = ({ open, onClose, patient }) => {
  const [riskData, setRiskData] = useState<RiskRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !patient) return;

    const fetchRiskData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        setLoading(true);
        const res = await fetch(
          `https://uzazisafe-backend.onrender.com/patients/${patient.id}/latest-risk`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) {
          setRiskData(null);
          return;
        }
        const data = await res.json();
        setRiskData(data);
      } catch (err) {
        console.error("Error loading risk data:", err);
        setRiskData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, [open, patient]);

  const getDoctorInsight = (feature: string, value: number) => {
    switch (feature) {
      case "Systolic BP":
        if (value > 140)
          return { text: "High BP - monitor for preeclampsia.", level: "attention" };
        if (value < 90)
          return { text: "Low BP - assess hydration and anemia.", level: "monitor" };
        return { text: "Stable systolic pressure.", level: "normal" };
      case "Diastolic BP":
        if (value > 90)
          return { text: "Raised diastolic BP - monitor closely.", level: "attention" };
        if (value < 60)
          return { text: "Low diastolic - ensure hydration.", level: "monitor" };
        return { text: "Diastolic pressure normal.", level: "normal" };
      case "Blood Sugar":
        if (value > 7.8)
          return {
            text: "Elevated sugar - manage gestational diabetes risk.",
            level: "attention",
          };
        if (value < 3.5)
          return { text: "Low sugar - possible hypoglycemia.", level: "monitor" };
        return { text: "Blood sugar within range.", level: "normal" };
      case "Body Temperature":
        if (value > 99.5)
          return { text: "Slight fever - rule out infection.", level: "attention" };
        if (value < 97)
          return { text: "Below normal - monitor.", level: "monitor" };
        return { text: "Temperature normal.", level: "normal" };
      case "Heart Rate":
        if (value > 100)
          return {
            text: "Tachycardia - check for anxiety or fever.",
            level: "attention",
          };
        if (value < 60)
          return {
            text: "Low HR — evaluate cardiovascular status.",
            level: "monitor",
          };
        return { text: "Heart rate normal.", level: "normal" };
      default:
        return { text: "No intervention required.", level: "normal" };
    }
  };

  if (!patient) return null;

  const gestational =
    riskData?.patient_info?.gestational_diabetes ??
    patient.gestationalDiabetes ??
    "Unknown";

  const preexisting =
    riskData?.patient_info?.pre_existing_diabetes ??
    patient.preExistingDiabetes ??
    "Unknown";

  const complications =
    riskData?.patient_info?.previous_complications ??
    patient.complications ??
    "Unknown";

  const formatAnswer = (val?: string) => {
    if (!val) return "Unknown";
    const lower = val.toLowerCase();
    if (["yes", "no"].includes(lower)) return lower === "yes" ? "Yes" : "No";
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  const riskLevel = riskData?.risk_level || patient.latestRisk || "Low Risk";
  const vitals = riskData?.vitals || {};
  const assessmentDate = formatDate(riskData?.created_at);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-indigo-700" />
              <h2 className="text-xl font-semibold text-indigo-800 tracking-tight">
                {`Patient Summary — ${
                  patient.name || patient.fullName || "Unnamed"
                }`}
              </h2>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-gray-500">Fetching latest assessment...</p>
        ) : riskData ? (
          <div className="space-y-6 mt-4">
            {/* Basic Info */}
            <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-800">
                <div>
                  <p className="font-medium text-gray-600">Age</p>
                  <p className="mt-1 text-base font-semibold">
                    {patient.age ?? "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Last Check</p>
                  <p className="mt-1 text-base font-semibold">
                    {assessmentDate}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Risk Level</p>
                  <Badge
                    className={`mt-1 px-3 py-1 text-sm font-semibold rounded-full ${
                      riskLevel.includes("High")
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-green-100 text-green-700 border border-green-200"
                    }`}
                  >
                    {riskLevel}
                  </Badge>
                </div>
              </div>

              <hr className="my-5 border-gray-200" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-800">
                <div>
                  <p className="font-medium text-gray-600">Gestational Diabetes</p>
                  <p className="mt-1 text-base font-semibold">
                    {formatAnswer(gestational)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Preexisting Diabetes</p>
                  <p className="mt-1 text-base font-semibold">
                    {formatAnswer(preexisting)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Previous Complications</p>
                  <p className="mt-1 text-base font-semibold">
                    {formatAnswer(complications)}
                  </p>
                </div>
              </div>
            </section>

            {/* Vitals */}
            <section>
              <h4 className="text-sm font-semibold text-indigo-700 mb-2">
                {`📊 Latest Vitals (${assessmentDate})`}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(vitals).map(([key, value]) => {
                  const labelMap: Record<string, string> = {
                    systolic: "Systolic BP",
                    diastolic: "Diastolic BP",
                    bloodSugar: "Blood Sugar",
                    heartRate: "Heart Rate",
                    bodyTemp: "Body Temperature",
                  };
                  const label = labelMap[key] || key;
                  const numericValue = Number(value ?? 0);
                  const insight = getDoctorInsight(label, numericValue);

                  let unit = "";
                  if (label.includes("BP")) unit = "mmHg";
                  else if (label.includes("Sugar")) unit = "mmol/L";
                  else if (label.includes("Heart")) unit = "bpm";
                  else if (label.includes("Temp")) unit = "°F";

                  const displayText = `${value ?? "—"}${unit ? ` ${unit}` : ""}`;

                  return (
                    <Card
                      key={key}
                      className={`p-3 border ${
                        insight.level === "attention"
                          ? "border-red-300 bg-red-50"
                          : insight.level === "monitor"
                          ? "border-yellow-300 bg-yellow-50"
                          : "border-green-200 bg-green-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-800">
                        {label}
                      </p>
                      <p className="text-lg font-bold">{displayText}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {insight.text}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </section>

            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            No risk data found for this patient yet.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PatientSummaryModal;
