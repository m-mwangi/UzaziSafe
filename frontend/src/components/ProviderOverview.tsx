import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Users, Activity, CalendarDays, Clock } from "lucide-react";

function ProviderOverview({ provider }: { provider: any }) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  // State for backend stats
  const [stats, setStats] = useState({
    total_patients: 0,
    high_risk_patients: 0,
    scheduled_appointments: 0,
  });

  // State for daily appointments and activities
  const [todaysAppointments, setTodaysAppointments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const formatLocalTime = (timeString: string) => {
    if (!timeString) return "Unknown time";

    const parsed = Date.parse(timeString);

    if (!isNaN(parsed)) {
      return new Date(parsed).toLocaleString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        day: "2-digit",
        month: "short",
      });
    }

    return timeString; // fallback
  };

  // Fetch provider stats from backend
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchProviderStats = async () => {
      try {
        const res = await fetch("https://uzazisafe-backend.onrender.com/providers/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch provider stats");
        const data = await res.json();
        setStats({
          total_patients: data.total_patients,
          high_risk_patients: data.high_risk_patients,
          scheduled_appointments: data.scheduled_appointments,
        });
      } catch (err) {
        console.error("Error fetching provider stats:", err);
      }
    };

    fetchProviderStats();
  }, [provider]);

  // Fetch today's appointments
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchTodaysAppointments = async () => {
      try {
        const res = await fetch("https://uzazisafe-backend.onrender.com/providers/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch provider info");
        const providerData = await res.json();

        const res2 = await fetch(
          `https://uzazisafe-backend.onrender.com/appointments/provider/${providerData.email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res2.ok) throw new Error("Failed to fetch appointments");
        const data = await res2.json();

        const today = new Date();
        const todayStr = today.toLocaleDateString("en-CA"); 

        const todays = data.filter((a: any) => {
          if (a.status && a.status !== "Scheduled") return false;
          const appt = new Date(a.date);
          const apptStr = appt.toLocaleDateString("en-CA");
          return apptStr === todayStr;
        });

        setTodaysAppointments(todays);
      } catch (err) {
        console.error("Error loading today's appointments:", err);
      }
    };

    fetchTodaysAppointments();
    const interval = setInterval(fetchTodaysAppointments, 180000); // refresh every 3 minutes
    return () => clearInterval(interval);
  }, []);

  // Fetch recent activity from backend
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchRecentActivity = async () => {
      try {
        // Get provider info first
        const res = await fetch("https://uzazisafe-backend.onrender.com/providers/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch provider info");
        const providerData = await res.json();

        // Fetch recent activity for provider
        const res2 = await fetch(
          `https://uzazisafe-backend.onrender.com/providers/${providerData.provider_id}/activity`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res2.ok) throw new Error("Failed to fetch provider activity");
        const data = await res2.json();

        setActivities(data);
      } catch (err) {
        console.error("Error fetching recent activity:", err);
      }
    };

    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 120000); // refresh every 2 min
    return () => clearInterval(interval);
  }, []);

  // Scroll animation for sticky header shadow
  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 60));

  // Cards pulling data directly from backend
  const statCards = [
    {
      title: "Total Patients",
      value: stats.total_patients,
      desc: "Under your care",
      color: "text-indigo-700",
      icon: <Users className="w-6 h-6 text-indigo-700" />,
    },
    {
      title: "High-Risk Cases",
      value: stats.high_risk_patients,
      desc: "Need close monitoring",
      color: "text-red-600",
      icon: <Activity className="w-6 h-6 text-red-600" />,
    },
    {
      title: "Scheduled Consultations",
      value: stats.scheduled_appointments,
      desc: "Upcoming sessions",
      color: "text-green-600",
      icon: <CalendarDays className="w-6 h-6 text-green-600" />,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-10"
    >
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-blue-900 mb-2">
          Welcome, {provider?.fullName || "Healthcare Provider"}
        </h2>
        <p className="text-gray-600">
          <span className="font-medium text-indigo-700">{provider?.facility}</span>{" "}
          — <span className="text-sm text-gray-500">{provider?.role}</span>
        </p>
      </div>

      {/* Summary Cards */}
      <motion.div
        className={`sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 py-4 transition-shadow ${
          scrolled ? "shadow-lg" : "shadow-sm"
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
              className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-3 mb-2">
                {stat.icon}
                <h4 className={`font-semibold ${stat.color}`}>{stat.title}</h4>
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Appointments Today */}
      <div>
        <h3 className="text-xl font-bold text-indigo-700 mb-4">Appointments Today</h3>
        {todaysAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysAppointments.map((a: any) => (
              <Card
                key={a.id}
                className="bg-indigo-50 border border-indigo-100 shadow-sm hover:shadow-md transition rounded-xl"
              >
                <CardHeader className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-indigo-800">
                    {a.patient_name || "Unknown Patient"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-1">
                    Time:{" "}
                    <span className="font-semibold">
                      {new Date(a.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                  {a.appointment_type && (
                    <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                      {a.appointment_type}
                    </span>
                  )}
                  {a.facility && (
                    <p className="text-xs text-gray-500 mt-1">{a.facility}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No appointments scheduled for today.</p>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-xl font-bold text-indigo-700 mb-4">Recent Activity</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6">
          {activities.length > 0 ? (
            <div className="divide-y divide-indigo-50">
              {activities.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                    {activity.icon === "Users" ? (
                      <Users className={`w-4 h-4 ${activity.color}`} />
                    ) : activity.icon === "CalendarDays" ? (
                      <CalendarDays className={`w-4 h-4 ${activity.color}`} />
                    ) : (
                      <Activity className={`w-4 h-4 ${activity.color}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-gray-700 text-sm"
                      dangerouslySetInnerHTML={{ __html: activity.text }}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {formatLocalTime(activity.time)}
                    </p>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent activity recorded.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ProviderOverview;
