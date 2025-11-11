import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// ✅ CRA uses process.env.REACT_APP_*
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ✅ Always return clean headers object
const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

export function ProviderAnalytics() {
  const [pieData, setPieData] = useState([
    { name: "Low Risk", value: 0 },
    { name: "High Risk", value: 0 },
  ]);
  const [weeklyChart, setWeeklyChart] = useState<
    { date: string; avgScore: number }[]
  >([]);
  const [volumeData, setVolumeData] = useState<
    { date: string; count: number; avgRisk: number }[]
  >([]);
  const [summary, setSummary] = useState({
    total: 0,
    high: 0,
    low: 0,
    avgRisk: 0,
  });
  const [insights, setInsights] = useState<
    { icon: any; title: string; desc: string; color: string }[]
  >([]);

  const COLORS = ["#4ade80", "#f87171"]; // green, red

  // ✅ Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Get logged-in provider
        const meRes = await fetch(`${API_URL}/providers/me`, {
          headers: authHeaders(),
        });
        if (!meRes.ok) throw new Error("Failed to load provider info");
        const meData = await meRes.json();

        // 2️⃣ Get provider's risk summary
        const riskRes = await fetch(
          `${API_URL}/providers/${meData.provider_id}/risk-summary`,
          { headers: authHeaders() }
        );
        if (!riskRes.ok) throw new Error("Failed to load risk summary");

        const riskData = await riskRes.json();

        // 🗓️ Format weekly chart data
        const formatted = riskData.weekly.map((r: any) => ({
          date: new Date(r.date).toLocaleDateString(),
          avgScore: r.avg_high_prob ?? 0,
        }));

        setWeeklyChart(formatted);

        // 🧮 Compute summary stats
        const total = riskData.total_assessments ?? 0;
        const high = riskData.high_risk_count ?? 0;
        const low = riskData.low_risk_count ?? 0;
        const avgRisk = riskData.avg_risk ?? 0;

        setSummary({ total, high, low, avgRisk });

        // 🥧 Pie data
        setPieData([
          { name: "Low Risk", value: low },
          { name: "High Risk", value: high },
        ]);

        // 📊 Volume data
        const volume = riskData.weekly.map((r: any) => ({
          date: new Date(r.date).toLocaleDateString(),
          count: r.assessment_count ?? 0,
          avgRisk: r.avg_high_prob ?? 0,
        }));
        setVolumeData(volume);
      } catch (err: any) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  // ✅ Compute Insights dynamically based on actual data
  useEffect(() => {
    const newInsights: any[] = [];

    const prevHalf = weeklyChart.slice(0, Math.floor(weeklyChart.length / 2));
    const recentHalf = weeklyChart.slice(Math.floor(weeklyChart.length / 2));

    const avgPrev =
      prevHalf.reduce((a, b) => a + b.avgScore, 0) / (prevHalf.length || 1);
    const avgRecent =
      recentHalf.reduce((a, b) => a + b.avgScore, 0) / (recentHalf.length || 1);

    const riskChange = avgRecent - avgPrev;

    // === No data case ===
    if (summary.total === 0) {
      newInsights.push({
        icon: <Activity className="text-gray-400 w-5 h-5" />,
        title: "No Assessment Data",
        desc: "No patient assessments recorded yet for this period.",
        color: "gray",
      });
      setInsights(newInsights);
      return;
    }

    // === Trend analysis ===
    if (riskChange > 0.05) {
      newInsights.push({
        icon: <TrendingUp className="text-pink-500 w-5 h-5" />,
        title: "Rising Risk Trend",
        desc: `Average patient risk has increased by ${(riskChange * 100).toFixed(
          1
        )}% compared to earlier days. Review high-risk cases closely.`,
        color: "pink",
      });
    } else if (riskChange < -0.05) {
      newInsights.push({
        icon: <TrendingDown className="text-green-500 w-5 h-5" />,
        title: "Improving Risk Levels",
        desc: `Average patient risk has dropped by ${Math.abs(
          riskChange * 100
        ).toFixed(
          1
        )}% over recent days — this may indicate effective interventions.`,
        color: "green",
      });
    } else {
      newInsights.push({
        icon: <Activity className="text-blue-500 w-5 h-5" />,
        title: "Stable Risk Trend",
        desc: "Average risk levels have remained relatively stable over the past two weeks.",
        color: "blue",
      });
    }

    // === Risk distribution ===
    const highRatio = summary.high / (summary.total || 1);
    if (highRatio > 0.6) {
      newInsights.push({
        icon: <AlertTriangle className="text-red-500 w-5 h-5" />,
        title: "High-Risk Patients Majority",
        desc: `${(highRatio * 100).toFixed(
          1
        )}% of patients are currently high risk — prioritize immediate follow-ups.`,
        color: "red",
      });
    } else if (highRatio < 0.3) {
      newInsights.push({
        icon: <CheckCircle className="text-green-500 w-5 h-5" />,
        title: "Mostly Low-Risk Patients",
        desc: `${((1 - highRatio) * 100).toFixed(
          1
        )}% of patients are low risk — maintain preventive care strategies.`,
        color: "green",
      });
    } else {
      newInsights.push({
        icon: <Activity className="text-yellow-500 w-5 h-5" />,
        title: "Balanced Risk Distribution",
        desc: "Your patients show a mixed pattern of risk levels — monitor closely for potential shifts.",
        color: "yellow",
      });
    }

    // === Overall high average risk ===
    if (summary.avgRisk >= 0.7) {
      newInsights.push({
        icon: <AlertTriangle className="text-yellow-500 w-5 h-5" />,
        title: "High Overall Risk Levels",
        desc: `Average patient risk score is ${(summary.avgRisk * 100).toFixed(
          1
        )}%. Consider additional screenings or specialist involvement.`,
        color: "yellow",
      });
    }

    setInsights(newInsights);
  }, [summary, weeklyChart]);

  // ===== RENDER =====
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h3 className="text-xl font-semibold text-indigo-700 mb-6">
        Weekly Assessment Risk Overview
      </h3>

      {/* === KPI Summary === */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="bg-indigo-50 border border-indigo-100">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">Total Assessments</p>
            <p className="text-xl font-semibold text-indigo-700">
              {summary.total}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border border-green-100">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">Low Risk</p>
            <p className="text-xl font-semibold text-green-700">
              {summary.low}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border border-red-100">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">High Risk</p>
            <p className="text-xl font-semibold text-red-700">
              {summary.high}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border border-yellow-100">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">Avg. Risk Score</p>
            <p className="text-xl font-semibold text-yellow-700">
              {(summary.avgRisk * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* === Charts === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Risk Distribution</CardTitle>
            <CardDescription>
              Based on all assessments in the last 14 days
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="inside"
                    content={(props: any) => {
                      const { x, y, value, name } = props;
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#fff"
                          textAnchor="middle"
                          dominantBaseline="central"
                          style={{ fontSize: "14px", fontWeight: 600 }}
                        >
                          {`${name}\n${value}`}
                        </text>
                      );
                    }}
                  />
                </Pie>
                <Tooltip
                  formatter={(v: any, name: string) => [
                    `${v} assessments`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Average Risk per Day</CardTitle>
            <CardDescription>
              Daily average probability from assessments
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChart}>
                <XAxis dataKey="date" />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip
                  formatter={(v: any) => `${(v * 100).toFixed(1)}%`}
                  labelFormatter={(d) => `Date: ${d}`}
                />
                <Bar dataKey="avgScore" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assessment Volume</CardTitle>
            <CardDescription>
              Number of assessments per day, color-coded by risk
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(v: any, _name: any, props: any) => {
                    const avg = props?.payload?.avgRisk ?? 0;
                    return [
                      `${v} assessments (Avg Risk ${(avg * 100).toFixed(1)}%)`,
                    ];
                  }}
                  labelFormatter={(d) => `Date: ${d}`}
                />
                <Bar dataKey="count">
                  {volumeData.map((d, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={d.avgRisk >= 0.5 ? "#ef4444" : "#22c55e"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* === Insights === */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          Key Insights & Recommendations
        </h3>

        {insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((item, i) => (
              <Card
                key={i}
                className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full bg-${item.color}-50`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-600 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No insights available yet.</p>
        )}
      </div>
    </motion.div>
  );
}
