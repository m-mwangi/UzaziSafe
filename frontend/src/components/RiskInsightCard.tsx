import { Card, CardContent } from "./ui/card";
import { AlertTriangle, CheckCircle, Stethoscope, Leaf, Eye, Brain, Activity } from "lucide-react";

interface RiskInsightCardProps {
  result: any;
  formData: any;
}

// SHAP-Aware Clinical Insight Generator
function getReadableInsight(feature: string, value: string, shapValue: number = 0) {
  const num = parseFloat(value);
  let level: "normal" | "monitor" | "attention" = "normal";
  let text = "";

  switch (feature) {
    case "Age":
      if (num > 35) {
        level = "attention";
        text = "Above 35 - considered higher risk during pregnancy.";
      } else text = "Within healthy maternal age range.";
      break;

    case "Systolic BP":
      if (num > 135) {
        level = "attention";
        text = "Elevated - may indicate early signs of hypertension.";
      } else if (num < 90) {
        level = "monitor";
        text = "Lower than normal - ensure adequate hydration and rest.";
      } else text = "Within normal systolic range for pregnancy.";
      break;

    case "Diastolic BP":
      if (num > 85) {
        level = "attention";
        text = "Slightly high - may indicate rising blood pressure.";
      } else if (num < 55) {
        level = "monitor";
        text = "Below expected - may indicate low vascular tone.";
      } else text = "Normal diastolic pressure range.";
      break;

    case "Blood Sugar":
      if (num > 7.8) {
        level = "attention";
        text = "High blood sugar - possible gestational diabetes, monitor closely.";
      } else if (num < 3.2) {
        level = "monitor";
        text = "Low blood sugar - may indicate hypoglycemia, eat regularly.";
      } else text = "Healthy blood sugar range.";
      break;

    case "Body Temp":
      if (num > 99.5) {
        level = "attention";
        text = "Slightly elevated - may suggest fever or mild infection.";
      } else if (num < 96.5) {
        level = "monitor";
        text = "Below normal - keep warm and stay hydrated.";
      } else text = "Normal body temperature.";
      break;

    case "Heart Rate":
      if (num > 110) {
        level = "attention";
        text = "Elevated - may relate to stress or mild fever.";
      } else if (num < 60) {
        level = "monitor";
        text = "Lower than expected - monitor for dizziness or fatigue.";
      } else text = "Healthy resting heart rate.";
      break;

    case "Pre-existing Diabetes":
      if (value === "Yes") {
        level = "attention";
        text = "Pre-existing diabetes adds to pregnancy risk - maintain strict glucose control.";
      } else text = "No pre-existing diabetes reported.";
      break;

    case "Gestational Diabetes":
      if (value === "Yes") {
        level = "attention";
        text = "Gestational diabetes detected - ongoing glucose monitoring is important.";
      } else text = "No gestational diabetes reported.";
      break;

    case "Previous Complications":
      if (value === "Yes") {
        level = "attention";
        text = "Previous complications may increase recurrence risk - follow up regularly.";
      } else text = "No previous pregnancy complications reported.";
      break;

    default:
      text = "No data available for this indicator.";
  }

  if (Math.abs(shapValue) > 0.7) {
    if (shapValue > 0 && level === "normal") {
      level = "monitor";
      text = "Clinically within range, but model detected elevated influence - monitor closely.";
    } else if (shapValue < 0 && level === "attention") {
      text += " However, AI model indicates this may not strongly increase risk.";
    }
  }

  return { text, level };
}

// Recommendations
function getRecommendations(data: any) {
  const doctor: string[] = [];
  const lifestyle: string[] = [];
  const monitor: string[] = [];

  if (parseFloat(data.systolicBP) > 135)
    doctor.push("Consult your doctor to discuss blood pressure management and monitoring.");
  if (parseFloat(data.bloodSugar) > 7.8)
    lifestyle.push("Modify your diet and monitor blood sugar more frequently.");
  if (data.preExistingDiabetes === "Yes" || data.gestationalDiabetes === "Yes")
    doctor.push("Increase glucose monitoring and follow your clinician’s recommended plan.");
  if (parseFloat(data.age) > 35)
    monitor.push("Attend regular prenatal visits and request additional screenings as advised.");
  if (data.complications === "Yes")
    doctor.push("Discuss any previous pregnancy complications with your obstetrician to reduce recurrence risks.");

  if (doctor.length === 0 && lifestyle.length === 0 && monitor.length === 0)
    lifestyle.push("You’re doing well - maintain your healthy lifestyle and routine prenatal visits.");

  return { doctor, lifestyle, monitor };
}

// Circular Risk Gauge
function RiskGauge({ value, isHighRisk }: { value: number; isHighRisk: boolean }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 10) * circumference;
  const strokeColor = isHighRisk ? "#ef4444" : "#22c55e";

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90">
        <circle cx="50%" cy="50%" r={radius} stroke="#e5e7eb" strokeWidth="10" fill="none" />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={strokeColor}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-bold ${isHighRisk ? "text-red-600" : "text-green-600"}`}>
          {value.toFixed(1)}
        </span>
        <span className="text-sm text-gray-500">/ 10</span>
      </div>
    </div>
  );
}

export function RiskInsightCard({ result, formData }: RiskInsightCardProps) {
  const { Prediction, High_Risk_Probability, Top_Contributing_Factors } = result;
  const isHighRisk = Prediction === "High Risk";
  const riskScore = Math.round(High_Risk_Probability * 10);

  const shapFactors = (Top_Contributing_Factors || {}) as Record<string, number>;
  const factors = [
    { feature: "Age", value: formData.age },
    { feature: "Systolic BP", value: formData.systolicBP },
    { feature: "Diastolic BP", value: formData.diastolicBP },
    { feature: "Blood Sugar", value: formData.bloodSugar },
    { feature: "Body Temp", value: formData.bodyTemp },
    { feature: "Heart Rate", value: formData.heartRate },
    { feature: "Pre-existing Diabetes", value: formData.preExistingDiabetes },
    { feature: "Gestational Diabetes", value: formData.gestationalDiabetes },
    { feature: "Previous Complications", value: formData.complications },
  ];

  const { doctor, lifestyle, monitor } = getRecommendations(formData);

  const badgeColor = (level: string) => {
    switch (level) {
      case "attention":
        return "bg-red-100 text-red-700";
      case "monitor":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  const badgeLabel = (level: string) => {
    switch (level) {
      case "attention":
        return "Needs Attention";
      case "monitor":
        return "Monitor Closely";
      default:
        return "Within Healthy Range";
    }
  };

  const topFactors = Object.entries(shapFactors)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 3);

  return (
    <Card className={`mt-6 border-2 rounded-2xl shadow-md ${isHighRisk ? "border-red-400 bg-red-50" : "border-green-400 bg-green-50"}`}>
      <CardContent className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          {isHighRisk ? <AlertTriangle className="w-6 h-6 text-red-600" /> : <CheckCircle className="w-6 h-6 text-green-600" />}
          <h2 className={`text-2xl font-bold ${isHighRisk ? "text-red-600" : "text-green-600"}`}>
            {isHighRisk ? "Higher Risk Level Identified" : "Healthy Range Overall"}
          </h2>
        </div>

        {/* Summary */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-700 leading-relaxed">
            {isHighRisk
              ? "Several of your current indicators show elevated readings that may contribute to a higher pregnancy risk. Please discuss these results with your healthcare provider for personalized guidance."
              : "Your health indicators are largely within the healthy range. Continue maintaining your healthy lifestyle and attending regular prenatal visits."}
          </p>
        </div>

        {/* Risk Score */}
        <div className="flex flex-col items-center text-center">
          <h3 className="font-semibold text-lg text-gray-800 mb-2">Overall Risk Score</h3>
          <RiskGauge value={riskScore} isHighRisk={isHighRisk} />
          <p className="text-gray-700 mt-2 text-sm">
            Score: {riskScore} / 10 — {isHighRisk ? "Requires Medical Follow-up" : "Within Healthy Range"}
          </p>
        </div>

        {/* Model Insights */}
        {topFactors.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-lg text-gray-800">Model Insights </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              These are the key factors that most influenced the model’s prediction.
              <br />
              <span className="text-gray-500 text-xs">
                Positive values increase risk; negative values reduce risk.
              </span>
            </p>
            <div className="space-y-2">
              {topFactors.map(([feature, shapValue]: [string, number]) => (
                <div key={feature} className="flex justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <span className="font-medium text-gray-700">{feature}</span>
                  <span className={shapValue > 0 ? "text-red-600" : "text-green-600"}>
                    {shapValue > 0 ? "+" : ""}
                    {shapValue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Health Insights */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-lg text-gray-800">Health Insights (Clinical Ranges)</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">Summary of your current health indicators</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {factors.map((f, idx) => {
              const shapVal = shapFactors[f.feature] ?? 0;
              const { text, level } = getReadableInsight(f.feature, f.value, shapVal);
              return (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-800">{f.feature}</p>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeColor(level)}`}
                    >
                      {badgeLabel(level)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-8 space-y-4">
          <h3 className="font-semibold text-lg text-gray-800 mb-2">Personalized Care Recommendations</h3>
          {doctor.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="text-red-600 w-5 h-5" />
                <h4 className="font-semibold text-red-700">Doctor Advised</h4>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {doctor.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {lifestyle.length > 0 && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="text-green-600 w-5 h-5" />
                <h4 className="font-semibold text-green-700">Lifestyle Guidance</h4>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {lifestyle.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {monitor.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="text-yellow-600 w-5 h-5" />
                <h4 className="font-semibold text-yellow-700">Monitoring Tips</h4>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {monitor.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
