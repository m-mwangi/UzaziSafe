import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Trash2 } from "lucide-react";
import PatientSummaryModal from "./PatientSummaryModal";

// Utility: readable date
const formatDate = (iso?: string) => {
  if (!iso) return "Not recorded";
  try {
    const date = new Date(iso);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
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
  providerEmail?: string;
  doctorId?: string;
  assignedDoctor?: string;
  facility?: string;
  gestationalDiabetes?: string;
  preExistingDiabetes?: string;
  complications?: string;
}

export function ProviderPatients() {
  const [provider, setProvider] = useState<any>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const loadProvider = () => {
      const saved = localStorage.getItem("user");
      if (saved) setProvider(JSON.parse(saved));
    };
    loadProvider();
    window.addEventListener("storage", loadProvider);
    return () => window.removeEventListener("storage", loadProvider);
  }, []);

  // Load provider's patients from backend (by provider_id)
  useEffect(() => {
    const fetchPatients = async () => {
      if (!provider || !provider.provider_id) return;
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Missing authentication token");

        const res = await fetch(
          `https://uzazisafe-backend.onrender.com/providers/${provider.provider_id}/patients`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error(`Failed to fetch patients (${res.status})`);

        const data = await res.json();

        setPatients(
          data.map((p: any) => ({
            id: String(p.id),
            fullName: p.full_name,
            age: p.age,
            latestRisk: p.risk_level,
            lastCheck: p.last_assessment_date,
            assignedDoctor: provider.full_name || provider.provider_name,
            facility: p.hospital_name,
            gestationalDiabetes: p.gestational_diabetes ?? "Unknown",
            preExistingDiabetes: p.pre_existing_diabetes ?? "Unknown",
            complications: p.previous_complications ?? "Unknown",
          }))
        );
      } catch (err) {
        console.error("Error loading patients:", err);
      }
    };
    fetchPatients();
  }, [provider]);

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to discharge this patient from your care?"
    );
    if (!confirmed) return;
    const all = JSON.parse(localStorage.getItem("patients") || "[]");
    const updated = all.filter((p: any) => String(p.id) !== String(id));
    localStorage.setItem("patients", JSON.stringify(updated));
    setPatients((prev) => prev.filter((p) => String(p.id) !== String(id)));
  };

  const filtered = patients.filter((p) =>
    [p.name, p.fullName, p.notes, p.latestRisk]
      .filter(Boolean)
      .some((field) =>
        String(field).toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const highRiskPatients = filtered.filter((p) =>
    p.latestRisk?.toLowerCase().includes("high")
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-2xl font-semibold text-indigo-700">
          Patients Under Your Care
        </h3>
        <p className="text-gray-500 mt-1">
          View and monitor patients assigned to you, track their risk levels,
          and access detailed summaries.
        </p>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search patients by name, notes, or risk level..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {highRiskPatients.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h4 className="font-semibold text-red-700 mb-2">
            ⚠️ High-Risk Patients
          </h4>
          <ul className="text-sm text-gray-700 list-disc ml-5">
            {highRiskPatients.map((p) => (
              <li key={p.id}>
                {p.name || p.fullName} — Last Check: {formatDate(p.lastCheck)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium mb-2">No patients assigned yet.</p>
          <p className="text-sm">
            Once patients register under your hospital, they’ll automatically
            appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition rounded-xl"
            >
              <CardHeader>
                <CardTitle className="text-lg">
                  {p.name || p.fullName || "Unnamed Patient"}
                </CardTitle>
                {/* ID removed as requested */}
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-600">Age: {p.age || "N/A"}</p>
                <p className="text-sm text-gray-600">
                  Last Check: {formatDate(p.lastCheck)}
                </p>
                <Badge
                  className={`mt-2 ${
                    p.latestRisk?.includes("High")
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {p.latestRisk || "Low Risk"}
                </Badge>

                {p.notes && (
                  <p className="text-xs text-gray-500 mt-2">Notes: {p.notes}</p>
                )}

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-700"
                    onClick={() => {
                      setSelectedPatient(p);
                      setViewOpen(true);
                    }}
                  >
                    View Summary
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Discharge
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PatientSummaryModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        patient={selectedPatient}
      />
    </motion.div>
  );
}

export default ProviderPatients;
