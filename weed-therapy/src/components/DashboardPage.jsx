import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Header from "./Header";
import { toast } from "react-toastify";

const defaultStats = {
  from: null,
  to: null,
  dailySeries: [],
  totals: {
    totalDaysWithCheckin: 0,
    goodDays: 0,
    badDays: 0,
    currentStreak: 0,
    bestStreak: 0,
    avgCheckinQualityScore: null,
  },
  patterns: {
    avgMoodOnHighCraving: null,
    avgMoodOnLowCraving: null,
    avgCravingOnHighStress: null,
  },
  advancedMetrics: {
    moodStabilityIndex: null,
    copingEffectiveness: {
      avgMoodWithCoping: null,
      avgMoodWithoutCoping: null,
      difference: null,
    },
  },
};

const InsightSection = ({ title, data, collapsed, onToggle }) => {
  const periodLabel = data?.period
    ? `${data.period.from} → ${data.period.to}`
    : "Not enough data yet";

  const avgMood = data?.averages?.mood ?? "-";
  const improvement = data?.improvement?.absolute;
  const total = data?.totalCheckins ?? 0;
  const moodTrend = data?.moodTrend ?? [];

  const sparkData = moodTrend.map((d) => ({
    date: d.date,
    mood: d.mood ?? 0,
  }));

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-[#e1ddd3] rounded-2xl p-4 sm:p-5 shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3"
        aria-expanded={!collapsed}
      >
        <div className="text-left">
          <h4 className="text-sm sm:text-base font-semibold text-[#2E3A33]">
            {title}
          </h4>
          <div className="text-[11px] text-[#7A6C58] mt-0.5">
            {periodLabel}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7A6C58]">
          <span>{collapsed ? "Show" : "Hide"}</span>
          <span
            className={`inline-flex w-6 h-6 items-center justify-center rounded-full border border-[#e1ddd3] bg-[#fdfcfa] text-[11px]`}
          >
            {collapsed ? "▼" : "▲"}
          </span>
        </div>
      </button>

      {!collapsed && (
        <div className="mt-4 space-y-4 animate-fadeIn">
          {/* Top metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#E9F7F0] to-[#fdfcfa] border border-[#cde7d8] text-center">
              <div className="text-[11px] text-[#7A6C58] mb-1">Avg mood</div>
              <div className="text-lg sm:text-xl font-bold text-[#2F7E57]">
                {avgMood}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#E7F0FF] to-[#fdfcfa] border border-[#c6d9f4] text-center">
              <div className="text-[11px] text-[#7A6C58] mb-1">Change</div>
              <div
                className={`text-lg sm:text-xl font-bold ${
                  improvement > 0
                    ? "text-green-600"
                    : improvement < 0
                    ? "text-red-500"
                    : "text-gray-700"
                }`}
              >
                {improvement != null
                  ? `${improvement > 0 ? "+" : ""}${improvement}`
                  : "-"}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#FFF3E3] to-[#fdfcfa] border border-[#f1d9a8] text-center">
              <div className="text-[11px] text-[#7A6C58] mb-1">
                Total check-ins
              </div>
              <div className="text-lg sm:text-xl font-bold text-[#B27F1D]">
                {total}
              </div>
            </div>
          </div>

          {/* Sparkline / trend */}
          <div className="h-20">
            {moodTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={[0, 10]} hide />
                  <Tooltip formatter={(value) => [value, "Mood"]} />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="#6CB28E"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center text-xs text-[#7A6C58] h-full">
                Not enough check-ins to show a trend yet.
              </div>
            )}
          </div>

          {/* Summary text */}
          <div className="text-xs sm:text-sm text-[#4B3F2F] leading-relaxed">
            {data?.summaryText ??
              "Once you have more check-ins in this period, we’ll show a short reflection of your patterns here."}
          </div>

          {/* AI summary placeholder */}
          <div className="p-3 border border-dashed border-[#d9cfc0] rounded-xl text-xs sm:text-sm text-[#7A6C58] bg-[#fdfcfa]">
            <div className="font-semibold text-[#4B3F2F] mb-1">
              AI summary (coming soon)
            </div>
            <div>
              This will become a gentle, supportive summary of how you’re doing
              in this period – plus 1–2 actionable suggestions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState({
    weekly: null,
    monthly: null,
    alltime: null,
  });
  const [collapsed, setCollapsed] = useState({
    weekly: true,
    monthly: true,
    alltime: true,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/auth");
          return;
        }

        // User profile
        const userRes = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (userRes.data?.success) {
          setUser(userRes.data.user);
        }

        // Check-in stats
        const statsRes = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/checkin/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStats(statsRes.data?.stats ?? defaultStats);

        // Insights
        const [weeklyRes, monthlyRes, alltimeRes] = await Promise.all([
          axios
            .get(
              `${import.meta.env.VITE_BACKEND_URL}/api/checkin/insights/weekly`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .catch(() => null),
          axios
            .get(
              `${import.meta.env.VITE_BACKEND_URL}/api/checkin/insights/monthly`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .catch(() => null),
          axios
            .get(
              `${import.meta.env.VITE_BACKEND_URL}/api/checkin/insights/alltime`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .catch(() => null),
        ]);

        setInsights({
          weekly: weeklyRes?.data?.insights ?? null,
          monthly: monthlyRes?.data?.insights ?? null,
          alltime: alltimeRes?.data?.insights ?? null,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/auth");
        }
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fdfcfa] to-[#f5f3ee] flex flex-col">
        <Header title="Recovery Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm border border-[#e1ddd3] rounded-xl px-6 py-4 shadow-sm text-[#6CB28E] text-sm">
            Loading your recovery overview...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fdfcfa] to-[#f5f3ee] flex flex-col">
        <Header title="Recovery Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm border border-[#e1ddd3] rounded-xl px-6 py-4 shadow-sm text-red-500 text-sm">
            Failed to load user data.
          </div>
        </div>
      </div>
    );
  }

  const {
    totals = defaultStats.totals,
    patterns = defaultStats.patterns,
    dailySeries = defaultStats.dailySeries,
    advancedMetrics = defaultStats.advancedMetrics,
  } = stats || defaultStats;

  const chartData = dailySeries.map((day) => ({
    date: day.date,
    mood: day.mood,
    craving: day.craving,
    stress: day.stress,
    energy: day.energy,
  }));

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfcfa] to-[#f5f3ee] pb-10">
      <Header title="Recovery Dashboard" />

      <div className="max-w-6xl mx-auto px-4 mt-6 space-y-6">
        {/* Profile / greeting */}
        <div className="p-5 sm:p-6 bg-white/90 backdrop-blur-sm border border-[#e1ddd3] rounded-2xl shadow-sm flex items-start gap-3">
          <div className="hidden sm:flex w-10 h-10 rounded-full bg-[#EAF5EF] items-center justify-center text-[#6CB28E] text-xl">
            🌱
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-[#2E3A33] mb-1">
              Welcome back, {user.username}
            </h2>
            <p className="text-xs sm:text-sm text-[#7A6C58] leading-relaxed">
              This is your gentle snapshot of how you&apos;ve been doing. No
              judgment — just patterns, progress, and small steps.
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Days tracked"
            value={totals.totalDaysWithCheckin ?? 0}
            description="Days with at least one check-in"
          />
          <StatCard
            label="Current streak"
            value={totals.currentStreak ?? 0}
            description="Consecutive days of check-ins"
          />
          <StatCard
            label="Best streak"
            value={totals.bestStreak ?? 0}
            description="Your all-time best"
          />
          <StatCard
            label="Avg check-in quality"
            value={
              totals.avgCheckinQualityScore != null
                ? totals.avgCheckinQualityScore
                : "-"
            }
            description="How complete your check-ins are"
          />
        </div>

        {/* Mood trend chart */}
        <div className="p-5 sm:p-6 bg-white/90 backdrop-blur-sm border border-[#e1ddd3] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[#2E3A33]">
                Mood trend (last 30 days)
              </h3>
              <p className="text-[11px] sm:text-xs text-[#7A6C58]">
                Each point is your mood score from a daily check-in.
              </p>
            </div>
          </div>
          <div className="h-56 sm:h-64">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2dcd2" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: "#7A6C58" }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 11, fill: "#7A6C58" }}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Score"]}
                    labelFormatter={formatDate}
                  />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="#6CB28E"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs sm:text-sm text-[#7A6C58]">
                Not enough check-ins yet to show a mood trend. Try logging a few
                days in a row.
              </div>
            )}
          </div>
        </div>

        {/* Trigger patterns & advanced metrics */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 sm:p-6 bg-white/90 backdrop-blur-sm border border-[#e1ddd3] rounded-2xl shadow-sm">
            <h3 className="text-xs uppercase tracking-wide text-[#7A6C58] mb-3">
              Trigger patterns
            </h3>
            <ul className="text-xs sm:text-sm text-[#4B3F2F] space-y-2.5">
              <li>
                <span className="font-semibold">High craving days:</span>{" "}
                {patterns.avgMoodOnHighCraving != null ? (
                  <>avg mood {patterns.avgMoodOnHighCraving}/10</>
                ) : (
                  "not enough data yet."
                )}
              </li>
              <li>
                <span className="font-semibold">Low craving days:</span>{" "}
                {patterns.avgMoodOnLowCraving != null ? (
                  <>avg mood {patterns.avgMoodOnLowCraving}/10</>
                ) : (
                  "not enough data yet."
                )}
              </li>
              <li>
                <span className="font-semibold">On high stress days:</span>{" "}
                {patterns.avgCravingOnHighStress != null ? (
                  <>avg craving {patterns.avgCravingOnHighStress}/10</>
                ) : (
                  "not enough data yet."
                )}
              </li>
            </ul>
          </div>

          <div className="p-5 sm:p-6 bg-gradient-to-br from-[#F4ECFF] to-[#EAF5FF] border border-[#d7c7f4] rounded-2xl shadow-sm">
            <h3 className="text-xs uppercase tracking-wide text-[#4B3F2F] mb-3">
              Advanced insights
            </h3>
            <ul className="text-xs sm:text-sm text-[#4B3F2F] space-y-2.5">
              <li>
                <span className="font-semibold">Mood stability index:</span>{" "}
                {advancedMetrics?.moodStabilityIndex != null ? (
                  <>
                    {advancedMetrics.moodStabilityIndex}/100
                    <span className="text-[11px] text-[#7A6C58] ml-1">
                      {advancedMetrics.moodStabilityIndex >= 70
                        ? "(stable)"
                        : advancedMetrics.moodStabilityIndex >= 40
                        ? "(moderate)"
                        : "(variable)"}
                    </span>
                  </>
                ) : (
                  "not enough data yet."
                )}
              </li>
              <li>
                <span className="font-semibold">Coping effectiveness:</span>{" "}
                {advancedMetrics?.copingEffectiveness?.difference != null ? (
                  <>
                    <span
                      className={
                        advancedMetrics.copingEffectiveness.difference > 0
                          ? "text-green-600"
                          : "text-gray-700"
                      }
                    >
                      {advancedMetrics.copingEffectiveness.difference > 0
                        ? "+"
                        : ""}
                      {advancedMetrics.copingEffectiveness.difference} mood
                      points
                    </span>
                    <span className="block text-[11px] text-[#7A6C58] mt-1">
                      With coping:{" "}
                      {advancedMetrics.copingEffectiveness.avgMoodWithCoping ??
                        "-"}
                      /10 · Without:{" "}
                      {advancedMetrics.copingEffectiveness
                        .avgMoodWithoutCoping ?? "-"}
                      /10
                    </span>
                  </>
                ) : (
                  "not enough data yet."
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Insights sections */}
        <div className="space-y-4">
          <InsightSection
            title="Weekly insights"
            data={insights.weekly}
            collapsed={collapsed.weekly}
            onToggle={() =>
              setCollapsed((s) => ({ ...s, weekly: !s.weekly }))
            }
          />
          <InsightSection
            title="Monthly insights"
            data={insights.monthly}
            collapsed={collapsed.monthly}
            onToggle={() =>
              setCollapsed((s) => ({ ...s, monthly: !s.monthly }))
            }
          />
          <InsightSection
            title="All-time insights"
            data={insights.alltime}
            collapsed={collapsed.alltime}
            onToggle={() =>
              setCollapsed((s) => ({ ...s, alltime: !s.alltime }))
            }
          />
        </div>

        {/* Good vs bad days */}
        <div className="p-5 sm:p-6 bg-white/90 backdrop-blur-sm border border-[#e1ddd3] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[#2E3A33]">
                Recovery balance
              </h3>
              <p className="text-[11px] sm:text-xs text-[#7A6C58]">
                Both good and hard days are part of the process.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-8 sm:gap-12">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-green-600">
                {totals.goodDays ?? 0}
              </div>
              <div className="text-xs sm:text-sm text-[#7A6C58]">
                Softer / good days
              </div>
            </div>
            <div className="w-px h-12 bg-[#e1ddd3]" />
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-[#E76F51]">
                {totals.badDays ?? 0}
              </div>
              <div className="text-xs sm:text-sm text-[#7A6C58]">
                More challenging days
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ label, value, description }) => (
  <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-sm border border-[#e1ddd3] rounded-2xl text-center shadow-sm">
    <div className="text-xl sm:text-2xl font-semibold text-[#6CB28E] mb-1">
      {value}
    </div>
    <div className="text-xs sm:text-sm text-[#2E3A33] font-medium mb-0.5">
      {label}
    </div>
    <div className="text-[11px] text-[#7A6C58]">{description}</div>
  </div>
);

export default DashboardPage;