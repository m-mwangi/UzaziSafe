import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Card } from "./ui/card";

interface AppointmentsDashboardProps {
  userEmail: string;
}

interface Appointment {
  id: number;
  patient_name: string;
  date: string;
  time: string;
  appointment_type?: string;
  status: string;
  provider_id?: number;
  provider_name?: string;
  hospital_name?: string;
}

export function AppointmentsDashboard({
  userEmail,
}: AppointmentsDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [reschedulingId, setReschedulingId] = useState<number | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  // Fetch appointments from backend
  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No access token found.");

      const res = await fetch(
        `https://uzazisafe-backend.onrender.com/appointments/patient/${userEmail}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to load appointments.");

      const data = await res.json();

      const formatted: Appointment[] = data.map((a: any) => {
        const dateObj = new Date(a.date);

        // FIXED: display in local timezone instead of UTC
        const localDate = dateObj.toLocaleDateString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        const localTime = dateObj.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        return {
          id: Number(a.id),
          patient_name: a.patient_name || "Unknown",
          date: localDate,
          time: localTime,
          appointment_type: a.appointment_type || "Consultation",
          status:
            a.status === "Scheduled" ? "upcoming" : a.status.toLowerCase(),
          provider_id: a.provider_id,
          provider_name: a.provider_name || "—",
          hospital_name: a.hospital_name || "—",
        };
      });

      setAppointments(formatted);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to fetch appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) loadAppointments();
  }, [userEmail]);

  // Mark appointment as completed (persist to backend)
  const markCompleted = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No token found");

      const res = await fetch(
        `https://uzazisafe-backend.onrender.com/appointments/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "Completed" }),
        }
      );

      if (!res.ok) throw new Error("Failed to update appointment status.");

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "completed" } : a))
      );
      setConfirmation("Appointment marked as completed.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to mark appointment as done.");
    } finally {
      setTimeout(() => setConfirmation(""), 2500);
    }
  };

  // Cancel appointment (persist to backend)
  const cancelAppointment = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?"))
      return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No token found");

      const res = await fetch(
        `https://uzazisafe-backend.onrender.com/appointments/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "Cancelled" }),
        }
      );

      if (!res.ok) throw new Error("Failed to cancel appointment.");

      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setConfirmation("Appointment cancelled successfully.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to cancel appointment.");
    } finally {
      setTimeout(() => setConfirmation(""), 2500);
    }
  };

  // Reschedule (frontend-only)
  const startReschedule = (id: number, date: string, time: string) => {
    setReschedulingId(id);
    setNewDate(date);
    setNewTime(time);
  };

  const saveReschedule = (id: number) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, date: newDate, time: newTime } : a
      )
    );
    setConfirmation("Appointment rescheduled successfully.");
    setTimeout(() => setConfirmation(""), 2500);
    setReschedulingId(null);
  };

  // Categorize appointments
  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const completed = appointments.filter((a) => a.status === "completed");

  return (
    <div className="min-h-[90vh] bg-blue-50 px-8 py-10 transition-all duration-500">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-blue-200 pb-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#111827]">
              Appointments
            </h1>
            <p className="text-gray-700 text-base mt-1">
              Manage, reschedule, or cancel your healthcare appointments easily.
            </p>
          </div>
          <Button
            onClick={loadAppointments}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
          >
            Refresh
          </Button>
        </div>

        {/* Messages */}
        {loading && (
          <p className="text-center text-gray-700 italic">
            Loading appointments...
          </p>
        )}
        {error && (
          <p className="text-center bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
            {error}
          </p>
        )}
        {confirmation && (
          <p className="text-center bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg font-medium">
            {confirmation}
          </p>
        )}

        {/* Appointment Lists */}
        <div className="animate-fadeIn space-y-16">
          {/* Upcoming */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-900">
              Upcoming Appointments
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-gray-700 italic">
                No upcoming appointments yet.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map((a) => (
                  <Card
                    key={a.id}
                    className="p-6 bg-white shadow-sm hover:shadow-lg border border-blue-100 rounded-2xl transition-all"
                  >
                    {/* Header */}
                    <div className="flex flex-col gap-1 mb-2">
                      <h3 className="text-lg font-semibold text-indigo-700 capitalize">
                        {a.appointment_type}
                      </h3>
                      <p className="text-gray-700 text-sm">
                        <span className="font-medium text-gray-900"></span>{" "}
                        {a.provider_name || "—"}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="text-sm text-gray-700 mt-3 space-y-1.5">
                      <p>
                        <strong className="text-gray-900">📅 Date:</strong>{" "}
                        {a.date}
                      </p>
                      <p>
                        <strong className="text-gray-900">⏰ Time:</strong>{" "}
                        {a.time}
                      </p>
                      <p>
                        <strong className="text-gray-900">🏥 Facility:</strong>{" "}
                        {a.hospital_name || "—"}
                      </p>
                    </div>

                    {/* Actions */}
                    {reschedulingId === a.id ? (
                      <div className="mt-4 space-y-3 border-t pt-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button
                            onClick={() => saveReschedule(a.id)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg"
                          >
                            💾 Save
                          </Button>
                          <Button
                            onClick={() => setReschedulingId(null)}
                            className="bg-gray-400 hover:bg-gray-500 text-white text-xs px-4 py-2 rounded-lg"
                          >
                            ✖ Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3 mt-5 pt-3 border-t border-gray-100">
                        <Button
                          onClick={() => markCompleted(a.id)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={14} /> Done
                        </Button>
                        <Button
                          onClick={() => startReschedule(a.id, a.date, a.time)}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-1"
                        >
                          <Clock size={14} /> Reschedule
                        </Button>
                        <Button
                          onClick={() => cancelAppointment(a.id)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-1"
                        >
                          <XCircle size={14} /> Cancel
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Completed */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-green-900">
              Completed Appointments
            </h2>
            {completed.length === 0 ? (
              <p className="text-gray-700 italic">
                No completed appointments yet.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {completed.map((a) => (
                  <Card
                    key={a.id}
                    className="p-6 bg-white shadow-md rounded-2xl border border-gray-200 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="text-green-600 w-5 h-5" />
                      <h3 className="text-lg font-semibold text-green-700 capitalize">
                        {a.appointment_type}
                      </h3>
                    </div>
                    <p className="text-gray-700 text-sm">
                      <span className="font-medium text-gray-900"></span>{" "}
                      {a.provider_name || "—"}
                    </p>
                    <p className="text-sm text-gray-600 mt-3">
                      <strong>Date:</strong> {a.date} <br />
                      <strong>Time:</strong> {a.time} <br />
                      <strong>Facility:</strong> {a.hospital_name || "—"}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
