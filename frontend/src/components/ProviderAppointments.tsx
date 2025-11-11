import { useState, useEffect, ChangeEvent } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { CalendarDays, Clock, Plus, Trash2, CheckCircle } from "lucide-react";

interface Appointment {
  id: string;
  patient_name: string;
  date: string;
  time: string;
  appointment_type: string;
  status: string;
  hospital_name?: string;
  provider_id?: number;
  provider_name?: string;
}

interface Patient {
  id: string | number;
  full_name: string;
  email: string;
  hospital_name: string;
  risk_level?: string;
  current_risk_level?: string;
}

interface ProviderInfo {
  provider_id: number;
  provider_name: string;
  hospital_name: string;
  email: string;
}

export function ProviderAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(true); // added loading flag
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    date: "",
    time: "",
    type: "",
  });

  const token = localStorage.getItem("token") || "";

  // Load provider info from backend
  const loadProviderInfo = async () => {
    try {
      const res = await fetch("https://uzazisafe-backend.onrender.com/providers/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load provider info");
      const data = await res.json();
      setProviderInfo(data);
    } catch (err) {
      console.error("Failed to load provider:", err);
    }
  };

  // Load appointments for provider using provider_id
  const loadAppointments = async (providerId?: number) => {
    if (!providerId) return;
    try {
      const res = await fetch(
        `https://uzazisafe-backend.onrender.com/providers/${providerId}/appointments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch provider appointments");
      const data = await res.json();
      const mapped: Appointment[] = data.map((a: any) => {
        const d = new Date(a.date);
        return {
          id: String(a.id),
          patient_name: a.patient_name,
          date: d.toLocaleDateString("en-GB"),
          time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          appointment_type: a.appointment_type || "Consultation",
          status: a.status,
          hospital_name: a.hospital_name,
          provider_id: a.provider_id,
          provider_name: a.provider_name,
        };
      });
      setAppointments(mapped);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    }
  };

  // Load patients assigned to provider using provider_id
  const loadPatients = async (providerId?: number) => {
    if (!providerId) return;
    try {
      const res = await fetch(
        `https://uzazisafe-backend.onrender.com/providers/${providerId}/patients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch patients");
      const data = await res.json();
      const mapped: Patient[] = (Array.isArray(data) ? data : []).map((p: any) => ({
        ...p,
        id: String(p.id),
        risk_level: p.risk_level ?? p.current_risk_level,
        full_name: p.full_name || "Unknown",
      }));
      setPatients(mapped);
    } catch (err) {
      console.error("Failed to load patients:", err);
    }
  };

  useEffect(() => {
    loadProviderInfo();
  }, []);

  // Load both appointments and patients in parallel once provider info is ready
  useEffect(() => {
    const fetchProviderData = async () => {
      if (providerInfo?.provider_id) {
        setLoading(true); // start loading
        try {
          await Promise.all([
            loadAppointments(providerInfo.provider_id),
            loadPatients(providerInfo.provider_id),
          ]);
        } catch (err) {
          console.error("Error fetching provider data:", err);
        } finally {
          setLoading(false); // end loading
        }
      }
    };
    fetchProviderData();
  }, [providerInfo]);

  // Book new appointment
  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!providerInfo) throw new Error("Provider info not loaded");
      const patient = patients.find((p) => String(p.id) === String(formData.patientId));
      if (!patient) throw new Error("No patient selected");

      if (!formData.date || !formData.time || !formData.type) {
        throw new Error("Please fill in all fields.");
      }

      const payload = {
        patient_name: patient.full_name,
        date: `${formData.date}T${formData.time}:00`,
        appointment_type: formData.type || "Consultation",
        status: "Scheduled",
        hospital_name: providerInfo.hospital_name,
        provider_email: providerInfo.email,
        provider_id: providerInfo.provider_id,
      };

      const res = await fetch("https://uzazisafe-backend.onrender.com/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Book appointment failed:", res.status, errText);
        throw new Error("Failed to book appointment");
      }

      setConfirmation("Appointment scheduled successfully.");
      setFormData({ patientId: "", patientName: "", date: "", time: "", type: "" });
      setOpen(false);
      await loadAppointments(providerInfo.provider_id);
      setTimeout(() => setConfirmation(""), 3000);
    } catch (err) {
      console.error("Error booking appointment:", err);
      setConfirmation("Failed to schedule appointment.");
      setTimeout(() => setConfirmation(""), 3000);
    }
  };

  // Update status
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`https://uzazisafe-backend.onrender.com/appointments/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update appointment");
      if (providerInfo?.provider_id) await loadAppointments(providerInfo.provider_id);
      setConfirmation(
        newStatus === "Completed"
          ? "Appointment marked as completed."
          : "Appointment cancelled."
      );
      setTimeout(() => setConfirmation(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Show loading only during fetch
  if (loading) {
    return (
      <div className="text-center text-gray-600 mt-10">
        <p>Please wait while we fetch your appointments...</p>
      </div>
    );
  }

  const filtered = appointments.filter((a) =>
    a.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const upcoming = filtered.filter((a) => a.status === "Scheduled");
  const completed = filtered.filter((a) => a.status === "Completed");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold text-indigo-800">
          Appointment Manager
        </h3>
        <Button
          onClick={() => setOpen(true)}
          className="bg-indigo-700 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow"
        >
          <Plus className="w-4 h-4 mr-2" /> Schedule Appointment
        </Button>
      </div>

      {confirmation && (
        <div className="bg-green-50 border border-green-300 text-green-700 p-3 rounded-md text-center text-sm">
          {confirmation}
        </div>
      )}

      {/* Dialog for Booking */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAppointment} className="space-y-4">
            <div>
              <Label>Select Patient</Label>
              <select
                className="border rounded-md w-full p-2 mt-1"
                value={formData.patientId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    patientId: e.target.value,
                    patientName:
                      patients.find((p) => String(p.id) === e.target.value)?.full_name || "",
                  })
                }
                required
              >
                <option value="">Select...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.risk_level || "Risk N/A"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label>Appointment Type</Label>
              <Input
                placeholder="e.g., Consultation"
                value={formData.type}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-700 text-white">
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upcoming Appointments */}
      <section>
        <h4 className="text-lg font-semibold text-green-700 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" /> Upcoming Appointments
        </h4>
        {upcoming.length === 0 ? (
          <p className="text-gray-500 italic">No upcoming appointments.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-3">
            {upcoming.map((a) => (
              <Card
                key={a.id}
                className="bg-white border border-green-200 rounded-xl shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-black-700 text-lg font-semibold">
                    {a.appointment_type}
                  </CardTitle>
                  <CardDescription className="text-gray-700">
                    {a.patient_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-800">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-indigo-600" />
                    <span>{a.date}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-pink-600" />
                    <span>{a.time}</span>
                  </p>
                  {a.hospital_name && (
                    <p className="flex items-center gap-2">
                      <Building2Icon />
                      <span>{a.hospital_name}</span>
                    </p>
                  )}
                  <div className="flex justify-between mt-3 pt-2 border-t border-gray-200">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-green-700 hover:text-green-800"
                      onClick={() => updateStatus(a.id, "Completed")}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => updateStatus(a.id, "Cancelled")}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Completed Appointments */}
      <section>
        <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" /> Completed Appointments
        </h4>
        {completed.length === 0 ? (
          <p className="text-gray-500 italic">No completed appointments yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-3">
            {completed.map((a) => (
              <Card
                key={a.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-green-700 text-lg">
                    <CheckCircle className="w-5 h-5" />
                    {a.appointment_type}
                  </CardTitle>
                  <CardDescription className="text-gray-700">
                    {a.patient_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-800">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-indigo-600" />
                    <span>{a.date}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-pink-600" />
                    <span>{a.time}</span>
                  </p>
                  {a.hospital_name && (
                    <p className="flex items-center gap-2">
                      <Building2Icon />
                      <span>{a.hospital_name}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}

function Building2Icon() {
  return <span className="inline-block w-4 h-4 text-purple-600">🏥</span>;
}
