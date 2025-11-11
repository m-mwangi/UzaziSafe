import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import {
  LogOut,
  Activity,
  Users,
  TrendingUp,
  Stethoscope,
  UserCircle,
  Building2,
  CalendarDays,
} from "lucide-react";
import ProviderOverview from "./ProviderOverview";
import { ProviderPatients } from "./ProviderPatients";
import { ProviderAnalytics } from "./ProviderAnalytics";
import { ProviderAppointments } from "./ProviderAppointments";

interface ProviderDashboardProps {
  onLogout: () => void;
}

interface ActivityItem {
  id: number;
  icon: any;
  text: string;
  time: string;
  color: string;
}

export function ProviderDashboard({ onLogout }: ProviderDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [provider, setProvider] = useState({
    fullName: "Healthcare Provider",
    facility: "General Hospital",
    role: "Doctor",
    email: "",
  });

  // Load provider info immediately from localStorage (instant display)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setProvider({
        fullName:
          parsed.full_name || parsed.provider_name || "Healthcare Provider",
        facility: parsed.hospital_name || "General Hospital",
        role: parsed.role || "Provider",
        email: parsed.email || "",
      });
    }
  }, []);

  // Fetch provider info from backend (live refresh)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchProvider = async () => {
      try {
        const res = await fetch("https://uzazisafe-backend.onrender.com/providers/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch provider data");
        const data = await res.json();
        setProvider((prev) => ({
          ...prev,
          fullName: data.provider_name || data.full_name || prev.fullName,
          facility: data.hospital_name || prev.facility,
          role: data.role || prev.role,
          email: data.email || prev.email,
        }));
      } catch (err) {
        console.error("Error loading provider data:", err);
      }
    };

    fetchProvider();
  }, []);

  // Ensure provider_id and full info are stored in localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    const token = stored?.access_token || localStorage.getItem("token");

    if (stored?.is_provider && token) {
      fetch("https://uzazisafe-backend.onrender.com/providers/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch provider profile");
          return res.json();
        })
        .then((data) => {
          const updatedUser = { ...stored, ...data };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          console.log("Provider profile updated with provider_id:", updatedUser);
        })
        .catch((err) =>
          console.error("Error refreshing provider info:", err.message)
        );
    }
  }, []);

  // Listen for login events to auto-refresh provider info
  useEffect(() => {
    const refreshOnLogin = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setProvider({
          fullName:
            parsed.full_name || parsed.provider_name || "Healthcare Provider",
          facility: parsed.hospital_name || "General Hospital",
          role: parsed.role || "Provider",
          email: parsed.email || "",
        });
      }
    };
    window.addEventListener("userLogin", refreshOnLogin);
    return () => window.removeEventListener("userLogin", refreshOnLogin);
  }, []);

  const sidebarTabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "patients", label: "Patients", icon: Users },
    { id: "appointments", label: "Appointments", icon: CalendarDays },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  // Load recent activities
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("activityLog") || "[]");
    setActivities(saved);
  }, []);

  // Sync activities in real-time
  useEffect(() => {
    const syncActivities = () => {
      const updated = JSON.parse(localStorage.getItem("activityLog") || "[]");
      setActivities(updated);
    };

    window.addEventListener("storage", syncActivities);
    window.addEventListener("activityUpdate", syncActivities);

    return () => {
      window.removeEventListener("storage", syncActivities);
      window.removeEventListener("activityUpdate", syncActivities);
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-indigo-700 to-blue-700 text-white flex flex-col shadow-lg">
        {/* Logo Section */}
        <div className="p-6 border-b border-indigo-500/40 bg-indigo-700/90 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2">
            <Stethoscope className="w-6 h-6 text-blue-100" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide text-white">
            UzaziSafe
          </h1>
          <p className="text-sm text-indigo-200 mt-1 font-semibold uppercase tracking-widest">
            Provider Portal
          </p>
        </div>

        {/* Provider Info */}
        <div className="p-5 border-b border-indigo-500/40 bg-indigo-800/40">
          <div className="flex items-center gap-3 mb-3">
            <UserCircle className="w-9 h-9 text-blue-100" />
            <div className="flex flex-col">
              <p className="font-semibold text-white text-sm leading-tight">
                {provider.fullName || "Healthcare Provider"}
              </p>
              <p className="text-xs text-indigo-200">
                {provider.email || "email@example.com"}
              </p>
            </div>
          </div>

          <div className="flex items-center text-indigo-100 text-xs mt-2">
            <Building2 className="w-4 h-4 mr-2 opacity-90" />
            <span className="font-bold text-indigo-50 tracking-wide drop-shadow-sm">
              {provider.facility || "MediCare Clinic"}
            </span>
          </div>

          <p className="text-[11px] text-indigo-300 italic mt-1">
            {provider.role}
          </p>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-2 mt-2">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center w-full px-4 py-2 rounded-lg text-left transition-all duration-200 group ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-indigo-100 hover:bg-blue-600/50 hover:shadow-sm"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-lg shadow-lg"
                  transition={{ type: "spring", stiffness: 250, damping: 25 }}
                />
              )}
              <tab.icon className="w-5 h-5 mr-3 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}

          {/* Sign Out Button */}
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              onLogout();
            }}
            className="w-full mt-6 border-white/40 text-white hover:bg-blue-600 transition"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              layout
              key="overview"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              <ProviderOverview provider={provider} />
            </motion.div>
          )}

          {activeTab === "patients" && (
            <motion.div
              layout
              key="patients"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <ProviderPatients />
            </motion.div>
          )}

          {activeTab === "appointments" && (
            <motion.div
              layout
              key="appointments"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <ProviderAppointments />
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              layout
              key="analytics"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
            >
              <ProviderAnalytics/>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
