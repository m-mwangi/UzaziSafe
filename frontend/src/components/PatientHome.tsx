import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Activity,
  Stethoscope,
  Building2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// 🔹 Reusable component for label/value layout
function InfoCard({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500 font-medium tracking-wide">{title}</p>
      <div className="mt-1 text-[1.05rem] font-semibold text-indigo-900 leading-tight">
        {value}
      </div>
    </div>
  );
}

export function PatientHome({
  onAssessRisk,
  user,
}: {
  onAssessRisk: () => void;
  user: any;
}) {
  const [showModal, setShowModal] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Risk color logic
  const riskLevel = (user?.current_risk_level || "").toLowerCase();

const riskColor =
  riskLevel.includes("high")
    ? "text-red-700 bg-red-100 border border-red-200"
    : riskLevel.includes("low")
    ? "text-green-700 bg-green-100 border border-green-200"
    : "text-gray-700 bg-gray-100 border border-gray-200";

  // ✅ Handle booking
  const handleBookAppointment = async () => {
    if (!appointmentDate || !appointmentTime) {
      setError("Please choose both date and time.");
      return;
    }

    setLoading(true);
    setError("");
    setConfirmation("");

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Missing authentication token");

      const combinedDateTime = `${appointmentDate}T${appointmentTime}:00`;

      const payload = {
        patient_name: user.full_name,
        date: combinedDateTime,
        appointment_type: reason.trim() || "Consultation",
        provider_id: user.provider_id,
        provider_email: user.provider_email, // ✅ Added this line
        provider_name: user.provider_name,
        status: "Scheduled",
        hospital_name: user?.hospital_name || "",
      };

      const res = await fetch("http://127.0.0.1:8000/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Failed to book appointment (${res.status})`);

      const data = await res.json();
      console.log("✅ Appointment booked successfully:", data);

      const formattedMessage = `✅ Appointment booked with ${
        user.provider_name || "your doctor"
      } at ${user.hospital_name || "your facility"} on ${appointmentDate} at ${appointmentTime}.`;

      setConfirmation(formattedMessage);
      setAppointmentDate("");
      setAppointmentTime("");
      setReason("");
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while booking.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Format next appointment neatly
  const nextAppointmentDisplay = user?.next_appointment
    ? (() => {
        const d = new Date(user.next_appointment);
        const formattedDate = d.toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const formattedTime = d.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return (
          <div>
            <div className="text-indigo-900 font-medium">{formattedDate}</div>
            <div className="font-bold text-gray-900 mt-1">{formattedTime}</div>
          </div>
        );
      })()
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 w-full"
    >
      {/* Header */}
      <div className="text-left mb-6">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 20, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="text-5xl md:text-6xl inline-block"
          >
            👋
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold text-indigo-800"
          >
            Welcome back, {user?.full_name || "Friend"}!
          </motion.h2>
        </div>
        <p className="text-gray-600 text-lg mt-2">
          Here’s a quick overview of your current health journey.
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
        {/* Risk */}
        <Card>
          <CardHeader className="pb-2">
            <Activity className="text-indigo-500 w-5 h-5" />
          </CardHeader>
          <CardContent>
            <InfoCard
              title="Current Risk Level"
              value={
                <div>
                  <span
                    className={`text-base font-semibold px-3 py-1 rounded-full inline-block ${riskColor}`}
                  >
                    {user?.current_risk_level || "Unknown"}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">
                    {user?.last_assessment_date
                      ? `Last updated on ${new Date(
                          user.last_assessment_date
                        ).toLocaleString()}`
                      : "No recent assessment"}
                  </p>
                </div>
              }
            />
          </CardContent>
        </Card>

        {/* Next Appointment */}
        <Card>
          <CardHeader className="pb-2">
            <CalendarDays className="text-indigo-500 w-5 h-5" />
          </CardHeader>
          <CardContent>
            <InfoCard title="Next Appointment" value={nextAppointmentDisplay} />
          </CardContent>
        </Card>

        {/* Provider */}
        <Card>
          <CardHeader className="pb-2">
            <Stethoscope className="text-indigo-500 w-5 h-5" />
          </CardHeader>
          <CardContent>
            <InfoCard
              title="Your Provider"
              value={
                <span className="text-indigo-800 font-semibold">
                  {user?.provider_name || "Unassigned"}
                </span>
              }
            />
          </CardContent>
        </Card>

        {/* Facility */}
        <Card>
          <CardHeader className="pb-2">
            <Building2 className="text-indigo-500 w-5 h-5" />
          </CardHeader>
          <CardContent>
            <InfoCard
              title="Your Facility"
              value={
                <span className="text-indigo-800 font-semibold">
                  {user?.hospital_name || "—"}
                </span>
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-4 mt-6">
        <Button
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
          onClick={onAssessRisk}
        >
          Assess Risk
        </Button>
        <Button
          variant="outline"
          className="border-indigo-400 text-indigo-600 hover:bg-indigo-50"
          onClick={() => setShowModal(true)}
        >
          Book Appointment
        </Button>
      </div>

      {/* Confirmation */}
      {confirmation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 mt-4 bg-green-50 border border-green-300 text-green-700 rounded-lg text-sm"
        >
          {confirmation}
        </motion.div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative"
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-indigo-700 mb-4">
              Book an Appointment
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Appointment Date
                </label>
                <Input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Appointment Time
                </label>
                <Input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Reason / Type
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Prenatal Checkup (optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-indigo-600 text-white"
                  onClick={handleBookAppointment}
                  disabled={loading}
                >
                  {loading ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

