import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft } from "lucide-react";

// Shared hospital list
const facilities = [
  "Aga Khan Hospital",
  "Nairobi Women's Hospital",
  "MediCare Clinic",
  "UzaziSafe Health Center",
];

interface PatientSignupProps {
  onBack: () => void;
}

export function PatientSignup({ onBack }: PatientSignupProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    facility: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [assignedDoctor, setAssignedDoctor] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!formData.facility) {
      setError("Please select your hospital/facility.");
      return;
    }

    try {
      const response = await fetch("https://uzazisafe-backend.onrender.com/auth/signup/patient", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          full_name: formData.fullName,
          email: formData.email,
          password: formData.password,
          hospital_name: formData.facility,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        const message =
          typeof errorData.detail === "string"
            ? errorData.detail
            : Array.isArray(errorData.detail)
            ? errorData.detail.map((d: any) => d.msg).join(", ")
            : "Signup failed. Please try again.";

        throw new Error(message);
      }

      const data = await response.json();
      localStorage.setItem("user", JSON.stringify(data));
      setAssignedDoctor(data.assigned_doctor || "");

      setSuccess(
        `🎉 Account created successfully! ${
          data.assigned_doctor
            ? `You’ve been assigned to ${data.assigned_doctor}.`
            : ""
        }`
      );

      // Redirect back to login after 3 seconds
      setTimeout(() => onBack(), 3000);
    } catch (error: any) {
      setError(error.message || "Something went wrong during signup.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-200 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-indigo-200 bg-white/95 backdrop-blur-md">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-indigo-700">
                Create Patient Account
              </CardTitle>
              <p className="text-gray-500 mt-1 text-sm">
                Join UzaziSafe to begin your maternal health journey.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Jane Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Facility dropdown */}
              <div className="space-y-2">
                <Label htmlFor="facility">Hospital / Facility</Label>
                <select
                  id="facility"
                  name="facility"
                  value={formData.facility}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-400 focus:border-indigo-400"
                  required
                >
                  <option value="">Select Hospital</option>
                  {facilities.map((facility) => (
                    <option key={facility} value={facility}>
                      {facility}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Feedback */}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && (
                <div className="bg-green-50 border border-green-300 text-green-700 text-sm rounded-md p-3">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
