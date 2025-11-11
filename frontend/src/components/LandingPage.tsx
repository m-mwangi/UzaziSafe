import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Shield, Users } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

interface LandingPageProps {
  onLogin: (
    type: "patient" | "provider" | "createPatient" | "createProvider"
  ) => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<"patient" | "provider">("patient");

  // Patient login state
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  const [patientError, setPatientError] = useState("");

  // Provider login state
  const [providerEmail, setProviderEmail] = useState("");
  const [providerPassword, setProviderPassword] = useState("");
  const [providerError, setProviderError] = useState("");

  // ✅ Handle patient login (FastAPI)
  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatientError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: patientEmail,
          password: patientPassword,
        }),
      });

      if (!response.ok) {
        let errMsg = "Login failed — please check your credentials.";
        try {
          const err = await response.json();
          errMsg = err.detail || JSON.stringify(err);
        } catch {
          errMsg = await response.text();
        }
        throw new Error(errMsg);
      }

      const data = await response.json();

      // ✅ Clear legacy keys
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("loggedInProvider");
      localStorage.removeItem("appointments");
      localStorage.removeItem("riskHistory");

      // ✅ Use unified keys so App.tsx can read session
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data));

      // App.tsx expects "user"
      onLogin(data.is_provider ? "provider" : "patient");
    } catch (error: any) {
      setPatientError(
        error.message || "Login failed — please check your credentials."
      );
    }
  };

  // ✅ Handle provider login (FastAPI)
  const handleProviderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setProviderError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: providerEmail,
          password: providerPassword,
        }),
      });

      if (!response.ok) {
        let errMsg = "Login failed — please check your credentials.";
        try {
          const err = await response.json();
          errMsg = err.detail || JSON.stringify(err);
        } catch {
          errMsg = await response.text();
        }
        throw new Error(errMsg);
      }

      const data = await response.json();

      // ✅ Normalized shape for consistency
      const normalized = {
        full_name: data.full_name || "Unknown Provider",
        email: data.email,
        is_provider: true,
        access_token: data.access_token,
        hospital_name: data.hospital_name || "",
      };

      // ✅ Clear legacy keys
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("loggedInProvider");
      localStorage.removeItem("appointments");
      localStorage.removeItem("patients");
      localStorage.removeItem("riskHistory");

      // ✅ Save unified keys
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(normalized));

      onLogin("provider");
    } catch (error: any) {
      setProviderError(
        error.message || "Login failed — please check your credentials."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-200 flex flex-col">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-blue-700 to-indigo-600 text-white sticky top-0 z-10 shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
            UZ
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wide">UzaziSafe</h1>
            <p className="text-sm italic text-blue-100">
              Afya ya Mama, Tumaini la Kesho.
            </p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h1 className="text-4xl font-extrabold text-blue-800 leading-tight">
                Smarter Maternal Health Support for Every Mother
              </h1>
              <p className="text-lg text-gray-700">
                UzaziSafe empowers mothers and healthcare providers through
                personalized insights, timely health tracking, and access to
                trusted care — ensuring safer journeys from pregnancy to
                motherhood.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                {[
                  {
                    icon: <Activity className="size-5 text-indigo-700 mt-1" />,
                    title: "Real-Time Monitoring",
                    desc: "Easily record and monitor key health information anytime.",
                  },
                  {
                    icon: <Shield className="size-5 text-indigo-700 mt-1" />,
                    title: "Early Risk Detection",
                    desc: "Identify potential health risks early through continuous updates.",
                  },
                  {
                    icon: <Users className="size-5 text-indigo-700 mt-1" />,
                    title: "Connected Care",
                    desc: "Stay in touch with qualified healthcare professionals when needed.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-4 bg-white/90 backdrop-blur-sm rounded-lg border border-indigo-100 shadow-sm hover:shadow-md transition"
                  >
                    {item.icon}
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {item.title}
                      </h4>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right side - Login */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center"
            >
              <Card className="w-full max-w-md shadow-xl border-indigo-200 bg-white/95 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-indigo-700">
                    Welcome to UzaziSafe
                  </CardTitle>
                  <CardDescription>
                    Log in to access your maternal health portal and manage your
                    care journey.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Tabs
                    value={activeTab}
                    onValueChange={(v) =>
                      setActiveTab(v as "patient" | "provider")
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger
                        value="patient"
                        className={`py-2 rounded-md font-semibold transition ${
                          activeTab === "patient"
                            ? "bg-indigo-100 text-indigo-700"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        Patient
                      </TabsTrigger>
                      <TabsTrigger
                        value="provider"
                        className={`py-2 rounded-md font-semibold transition ${
                          activeTab === "provider"
                            ? "bg-indigo-100 text-indigo-700"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        Healthcare Provider
                      </TabsTrigger>
                    </TabsList>

                    {/* Patient Login */}
                    <TabsContent value="patient">
                      <form onSubmit={handlePatientLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="patient-email">Email</Label>
                          <Input
                            id="patient-email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={patientEmail}
                            onChange={(e) => setPatientEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="patient-password">Password</Label>
                          <Input
                            id="patient-password"
                            type="password"
                            placeholder="Enter your password"
                            value={patientPassword}
                            onChange={(e) =>
                              setPatientPassword(e.target.value)
                            }
                            required
                          />
                        </div>
                        {patientError && (
                          <p className="text-red-600 text-sm">{patientError}</p>
                        )}
                        <Button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                          Sign in as Patient
                        </Button>
                        <div className="text-center pt-4 border-t">
                          <p className="text-gray-500 mb-3">
                            Don’t have an account?
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                            onClick={() => onLogin("createPatient")}
                          >
                            Create Patient Account
                          </Button>
                        </div>
                      </form>
                    </TabsContent>

                    {/* Provider Login */}
                    <TabsContent value="provider">
                      <form onSubmit={handleProviderLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="provider-email">Email</Label>
                          <Input
                            id="provider-email"
                            type="email"
                            placeholder="doctor@hospital.com"
                            value={providerEmail}
                            onChange={(e) =>
                              setProviderEmail(e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="provider-password">Password</Label>
                          <Input
                            id="provider-password"
                            type="password"
                            placeholder="Enter your password"
                            value={providerPassword}
                            onChange={(e) =>
                              setProviderPassword(e.target.value)
                            }
                            required
                          />
                        </div>
                        {providerError && (
                          <p className="text-red-600 text-sm">{providerError}</p>
                        )}
                        <Button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                          Sign in as Provider
                        </Button>
                        <div className="text-center pt-4 border-t">
                          <p className="text-gray-500 mb-3">
                            New healthcare provider?
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                            onClick={() => onLogin("createProvider")}
                          >
                            Request Provider Access
                          </Button>
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white py-6 text-center mt-12">
        <p className="text-sm">© 2025 UzaziSafe. All rights reserved.</p>
      </footer>
    </div>
  );
}
