import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  DotProps,
} from "recharts";
import { Button } from "./ui/button";

interface RiskAnalyticsDashboardProps {
  refreshKey?: number;
  userEmail: string;
}

interface RiskHistoryApiEntry {
  id: number;
  patientId: number;
  timestamp: string;
  risk: string;
  probability_high: number;
  probability_low: number;
}

interface HistoryEntry {
  timestamp: string;
  highProb: number;
  prediction: string;
}

interface ChartPoint {
  time?: string;
  fullDate?: string;
  date?: string;
  score: number;
  prediction?: string;
}

// CRA uses process.env.REACT_APP_*
const API_URL = process.env.REACT_APP_API_URL || "https://uzazisafe-backend.onrender.com";

// Always return clean headers object
const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

export function RiskAnalyticsDashboard({
  refreshKey,
  userEmail,
}: RiskAnalyticsDashboardProps) {
  const [viewMode, setViewMode] = useState<"today" | "week">("today");
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [lastScore, setLastScore] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get logged-in patient details
        const meRes = await fetch(`${API_URL}/patients/me`, {
          headers: authHeaders(),
        });
        if (!meRes.ok) throw new Error("Failed to load patient info");

        const meData = await meRes.json();
        const patientId = meData.patient_id;
        if (!patientId)
          throw new Error("No patient_id found in /patients/me response");

        // Get patient's risk history
        const riskRes = await fetch(
          `${API_URL}/assess-risk/patient/${patientId}`,
          { headers: authHeaders() }
        );

        if (!riskRes.ok) {
          if (riskRes.status === 404) {
            setHistoryData([]);
            setChartData([]);
            setAverageScore(0);
            setLastScore(0);
            setLoading(false);
            return;
          }
          throw new Error("Failed to load risk history");
        }

        const riskData: RiskHistoryApiEntry[] = await riskRes.json();
        const formatted: HistoryEntry[] = riskData.map((item) => ({
          timestamp: item.timestamp,
          highProb: Number(item.probability_high ?? 0),
          prediction: item.risk ?? "Low Risk",
        }));

        setHistoryData(formatted);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error loading risk history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [refreshKey, userEmail]);

  // Compute chart and stats
  useEffect(() => {
    if (historyData.length === 0) {
      setChartData([]);
      setAverageScore(0);
      setLastScore(0);
      return;
    }

    if (viewMode === "today") {
      const today = new Date().toLocaleDateString();
      const todayPreds = historyData
        .filter(
          (h) => new Date(h.timestamp).toLocaleDateString() === today
        )
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() -
            new Date(b.timestamp).getTime()
        );

      const chart = todayPreds.map((h) => ({
        time: new Date(h.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        fullDate: new Date(h.timestamp).toLocaleString(),
        score: h.highProb ?? 0,
        prediction: h.prediction,
      }));

      setChartData(chart);

      const scores = chart
        .map((c) => c.score)
        .filter((n) => !isNaN(n));
      if (scores.length) {
        setAverageScore(
          scores.reduce((a, b) => a + b, 0) / scores.length
        );
        setLastScore(scores[scores.length - 1]);
      }
    } else {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);

      const weekly = historyData.filter(
  (h) => new Date(h.timestamp) >= oneWeekAgo
);

// Group by ISO date key
const grouped: Record<string, number[]> = {};
weekly.forEach((h) => {
  const dateObj = new Date(h.timestamp);
  const isoKey = dateObj.toISOString().split("T")[0]; // e.g. 2025-11-13
  if (!grouped[isoKey]) grouped[isoKey] = [];
  grouped[isoKey].push(h.highProb ?? 0);
});

// Build chart array and sort chronologically
const chart = Object.entries(grouped)
  .map(([isoKey, vals]) => ({
    sortKey: isoKey,
    date: new Date(isoKey).toLocaleDateString("en-GB"), // keep DD/MM/YYYY
    score: vals.reduce((a, b) => a + b, 0) / vals.length,
  }))
  .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

setChartData(chart);

      const scores = chart.map((c) => c.score);
      if (scores.length) {
        setAverageScore(
          scores.reduce((a, b) => a + b, 0) / scores.length
        );
        setLastScore(scores[scores.length - 1]);
      }
    }
  }, [viewMode, historyData]);

  // Dot color logic
  const renderConditionalDot = (props: DotProps): React.ReactElement => {
    const { cx, cy, payload } = props as any;
    if (!cx || !cy || !payload) return <></>;
    const color =
      payload.prediction === "High Risk" || payload.score > 0.5
        ? "#ef4444"
        : "#22c55e";
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={color}
        stroke="#fff"
        strokeWidth={1.5}
      />
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const item = payload[0].payload;
      const riskType =
        item.prediction === "High Risk" || item.score > 0.5
          ? "High Risk"
          : "Low Risk";
      const bgColor =
        riskType === "High Risk"
          ? "linear-gradient(135deg, rgba(239,68,68,0.9), rgba(248,113,113,0.9))"
          : "linear-gradient(135deg, rgba(34,197,94,0.9), rgba(134,239,172,0.9))";

      let trend = "";
      if (viewMode === "today" && chartData.length > 1) {
        const i = chartData.findIndex((d) => d.time === item.time);
        if (i > 0) {
          const diff = item.score - chartData[i - 1].score;
          trend =
            diff > 0.02
              ? "↑ Increased"
              : diff < -0.02
              ? "↓ Decreased"
              : "→ Stable";
        }
      }

      return (
        <div
          style={{
            background: bgColor,
            color: "#fff",
            padding: "10px 14px",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: "14px",
          }}
        >
          {viewMode === "today" ? (
            <div> {item.time}</div>
          ) : (
            <div> {item.date}</div>
          )}
          <div>
            Risk Probability: {(item.score * 100).toFixed(1)}%
          </div>
          {trend && (
            <div style={{ opacity: 0.85, fontStyle: "italic" }}>
              {trend}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // ====== RENDER ======
  if (loading) {
    return <p className="text-gray-500 italic">Loading risk analytics...</p>;
  }

  if (error) {
    return (
      <p className="text-red-500 text-sm">
        Failed to load risk analytics: {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-blue-800">
          {viewMode === "today"
            ? "Today's Predictions"
            : "Weekly Summary"}
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode("today")}
            className={
              viewMode === "today"
                ? "bg-blue-600 text-white"
                : "border border-blue-400 text-blue-700"
            }
          >
            Today
          </Button>
          <Button
            onClick={() => setViewMode("week")}
            className={
              viewMode === "week"
                ? "bg-blue-600 text-white"
                : "border border-blue-400 text-blue-700"
            }
          >
            Weekly
          </Button>
        </div>
      </div>

      <p className="text-gray-600">
        {viewMode === "today"
          ? "Track your risk changes throughout the day."
          : "View your average risk over the past 7 days."}
      </p>

      {chartData.length === 0 ? (
        <p className="text-gray-500 italic">
          {viewMode === "today"
            ? "No predictions for today yet."
            : "No data found for last week."}
        </p>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-800">
                  Average Risk{" "}
                  {viewMode === "today" ? "Today" : "This Week"}
                </CardTitle>
                <CardDescription>
                  {viewMode === "today"
                    ? "Across today's predictions"
                    : "Across the past 7 days"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-700">
                  {(averageScore * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-800">
                  Last Score
                </CardTitle>
                <CardDescription>
                  Most recent prediction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-700">
                  {(lastScore * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-800">
                  Predictions Count
                </CardTitle>
                <CardDescription>Records displayed</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-700">
                  {chartData.length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-blue-800">
                {viewMode === "today"
                  ? "Risk Trend Throughout the Day"
                  : "Average Risk Trend (7 Days)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey={viewMode === "today" ? "time" : "date"}
                    stroke="#4b5563"
                  />
                  <YAxis
                    domain={[0, 1]}
                    stroke="#4b5563"
                    tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={renderConditionalDot}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
