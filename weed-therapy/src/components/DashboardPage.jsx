// src/components/DashboardPage.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "react-toastify";

const defaultStats = {
  from: null, to: null, dailySeries: [],
  totals: {
    totalDaysWithCheckin: 0, goodDays: 0, badDays: 0,
    currentStreak: 0, bestStreak: 0, avgCheckinQualityScore: null,
  },
  patterns: {
    avgMoodOnHighCraving: null, avgMoodOnLowCraving: null, avgCravingOnHighStress: null,
  },
  advancedMetrics: {
    moodStabilityIndex: null,
    copingEffectiveness: { avgMoodWithCoping: null, avgMoodWithoutCoping: null, difference: null },
  },
};

// ── Animated counter ──────────────────────────────────────────────────────────
const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (typeof value !== "number") return;
    let start = 0;
    const end = value;
    if (start === end) { setDisplay(end); return; }
    const duration = 800;
    const step = (end - start) / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{typeof value === "number" ? display : value}</>;
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, description, icon, color = "#6CB28E", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.25 }}
    className="p-4 bg-white border border-[#e1ddd3] rounded-2xl text-center shadow-sm"
  >
    <div className="text-xl mb-1">{icon}</div>
    <div className="text-2xl font-bold mb-0.5" style={{ color }}>
      <AnimatedNumber value={typeof value === "number" ? value : value} />
    </div>
    <div className="text-xs font-semibold text-[#2E3A33] mb-0.5">{label}</div>
    <div className="text-[10px] text-[#9a8e80] leading-tight">{description}</div>
  </motion.div>
);

// ── Insight section ───────────────────────────────────────────────────────────
const InsightSection = ({ title, data, collapsed, onToggle, delay = 0 }) => {
  const periodLabel = data?.period
    ? `${data.period.from} → ${data.period.to}`
    : "Not enough data yet";
  const avgMood = data?.averages?.mood ?? "-";
  const improvement = data?.improvement?.absolute;
  const total = data?.totalCheckins ?? 0;
  const moodTrend = data?.moodTrend ?? [];
  const sparkData = moodTrend.map((d) => ({ date: d.date, mood: d.mood ?? 0 }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border border-[#e1ddd3] rounded-2xl shadow-sm overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4"
        aria-expanded={!collapsed}
      >
        <div className="text-left">
          <h4 className="text-sm font-semibold text-[#2E3A33]">{title}</h4>
          <p className="text-[11px] text-[#9a8e80] mt-0.5">{periodLabel}</p>
        </div>
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f5f3ee] border border-[#e1ddd3] text-[#7A6C58] flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-[#f0ebe1]">
              <div className="grid grid-cols-3 gap-3 pt-4">
                {[
                  { label: "Avg mood", value: avgMood, color: "text-[#2F7E57]", bg: "from-[#E9F7F0] to-white", border: "border-[#cde7d8]" },
                  { label: "Change", value: improvement != null ? `${improvement > 0 ? "+" : ""}${improvement}` : "-", color: improvement > 0 ? "text-green-600" : improvement < 0 ? "text-red-500" : "text-gray-600", bg: "from-[#E7F0FF] to-white", border: "border-[#c6d9f4]" },
                  { label: "Check-ins", value: total, color: "text-[#B27F1D]", bg: "from-[#FFF3E3] to-white", border: "border-[#f1d9a8]" },
                ].map(({ label, value, color, bg, border }) => (
                  <div key={label} className={`p-3 rounded-2xl bg-gradient-to-br ${bg} border ${border} text-center`}>
                    <div className="text-[10px] text-[#9a8e80] mb-1">{label}</div>
                    <div className={`text-lg font-bold ${color}`}>{value}</div>
                  </div>
                ))}
              </div>

              <div className="h-20">
                {sparkData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkData}>
                      <XAxis dataKey="date" hide />
                      <YAxis domain={[0, 10]} hide />
                      <Tooltip formatter={(v) => [v, "Mood"]} />
                      <Line type="monotone" dataKey="mood" stroke="#6CB28E" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-[#9a8e80]">
                    Not enough check-ins to show a trend yet.
                  </div>
                )}
              </div>

              <p className="text-xs text-[#4B3F2F] leading-relaxed">
                {data?.summaryText ?? "Once you have more check-ins in this period, we'll show a short reflection of your patterns here."}
              </p>

              <div className="p-3 border border-dashed border-[#d9cfc0] rounded-2xl text-xs text-[#9a8e80] bg-[#fdfcfa]">
                <p className="font-semibold text-[#7A6C58] mb-1">🤖 AI summary <span className="font-normal">(coming soon)</span></p>
                <p>A gentle, supportive summary of how you're doing — plus 1–2 actionable suggestions.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const fmt = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  return (
    <div className="bg-white border border-[#e1ddd3] rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-[#2E3A33] mb-1">{fmt(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState({ weekly: null, monthly: null, alltime: null });
  const [collapsed, setCollapsed] = useState({ weekly: true, monthly: true, alltime: true });
  const [activeLines, setActiveLines] = useState({ mood: true, craving: true, stress: false, energy: false });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/auth"); return; }

        const [userRes, statsRes, weeklyRes, monthlyRes, alltimeRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/checkin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/checkin/insights/weekly`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/checkin/insights/monthly`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/checkin/insights/alltime`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        ]);

        if (userRes.data?.success) setUser(userRes.data.user);
        setStats(statsRes.data?.stats ?? defaultStats);
        setInsights({
          weekly: weeklyRes?.data?.insights ?? null,
          monthly: monthlyRes?.data?.insights ?? null,
          alltime: alltimeRes?.data?.insights ?? null,
        });
      } catch (error) {
        if (error.response?.status === 401) { localStorage.removeItem("token"); navigate("/auth"); }
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[#6CB28E]"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
          <p className="text-sm text-[#7A6C58] mt-1">Loading your recovery overview...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-white border border-red-200 rounded-2xl px-6 py-4 text-red-500 text-sm">
          Failed to load user data.
        </div>
      </div>
    );
  }

  const { totals = defaultStats.totals, patterns = defaultStats.patterns,
    dailySeries = [], advancedMetrics = defaultStats.advancedMetrics } = stats || defaultStats;

  const chartData = dailySeries.map((day) => ({
    date: day.date, mood: day.mood, craving: day.craving,
    stress: day.stress, energy: day.energy,
  }));

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const LINE_CONFIG = [
    { key: "mood",    color: "#6CB28E", label: "Mood" },
    { key: "craving", color: "#E76F51", label: "Craving" },
    { key: "stress",  color: "#F4A261", label: "Stress" },
    { key: "energy",  color: "#2A9D8F", label: "Energy" },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-5">

      {/* ── Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#EAF5EF] to-white border border-[#c6e3d1] rounded-2xl p-5 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6CB28E] to-[#4a9e6b] flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
          🌱
        </div>
        <div>
          <h2 className="text-base font-bold text-[#2E3A33]">Welcome back, {user.username}</h2>
          <p className="text-xs text-[#7A6C58] leading-relaxed mt-0.5">
            Your gentle recovery snapshot. No judgment — just patterns, progress, and small steps.
          </p>
        </div>
      </motion.div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon="📅" label="Days tracked" value={totals.totalDaysWithCheckin ?? 0} description="Days with check-ins" color="#6CB28E" delay={0.05} />
        <StatCard icon="🔥" label="Current streak" value={totals.currentStreak ?? 0} description="Consecutive days" color="#E76F51" delay={0.1} />
        <StatCard icon="🏆" label="Best streak" value={totals.bestStreak ?? 0} description="Your all-time best" color="#F4A261" delay={0.15} />
        <StatCard icon="⭐" label="Check-in quality" value={totals.avgCheckinQualityScore ?? "-"} description="Avg completion score" color="#2A9D8F" delay={0.2} />
      </div>

      {/* ── Mood trend chart ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white border border-[#e1ddd3] rounded-2xl shadow-sm p-5"
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#2E3A33]">Wellness trends</h3>
            <p className="text-[11px] text-[#9a8e80]">Last 30 days — tap legend to toggle lines</p>
          </div>
        </div>

        {/* Line toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          {LINE_CONFIG.map(({ key, color, label }) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveLines((p) => ({ ...p, [key]: !p[key] }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                activeLines[key]
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white text-[#9a8e80] border-[#e1ddd3]"
              }`}
              style={activeLines[key] ? { backgroundColor: color } : {}}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeLines[key] ? "white" : color }} />
              {label}
            </motion.button>
          ))}
        </div>

        <div className="h-52 sm:h-64">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe1" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: "#9a8e80" }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "#9a8e80" }} width={20} />
                <Tooltip content={<CustomTooltip />} />
                {LINE_CONFIG.map(({ key, color, label }) =>
                  activeLines[key] ? (
                    <Line key={key} type="monotone" dataKey={key} name={label}
                      stroke={color} strokeWidth={2} dot={{ r: 2.5, fill: color }}
                      activeDot={{ r: 5 }} />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-[#9a8e80]">
              <span className="text-3xl">📊</span>
              <p className="text-sm">Log a few check-ins to see your trends here</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Trigger patterns + advanced metrics ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-[#e1ddd3] rounded-2xl shadow-sm p-5"
        >
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#7A6C58] mb-3">🔍 Trigger patterns</h3>
          <div className="space-y-3">
            {[
              { label: "High craving days", value: patterns.avgMoodOnHighCraving, suffix: "/10 avg mood", color: "#E76F51" },
              { label: "Low craving days", value: patterns.avgMoodOnLowCraving, suffix: "/10 avg mood", color: "#6CB28E" },
              { label: "High stress → craving", value: patterns.avgCravingOnHighStress, suffix: "/10 avg craving", color: "#F4A261" },
            ].map(({ label, value, suffix, color }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#4B3F2F]">{label}</span>
                <span className="text-xs font-bold" style={{ color }}>
                  {value != null ? `${value}${suffix}` : "—"}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-[#F4ECFF] to-[#EAF5FF] border border-[#d7c7f4] rounded-2xl shadow-sm p-5"
        >
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#4B3F2F] mb-3">🧠 Advanced insights</h3>
          <div className="space-y-3">
            {/* Mood stability */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#4B3F2F]">Mood stability index</span>
                <span className="text-xs font-bold text-[#7B3FC4]">
                  {advancedMetrics?.moodStabilityIndex != null ? `${advancedMetrics.moodStabilityIndex}/100` : "—"}
                </span>
              </div>
              {advancedMetrics?.moodStabilityIndex != null && (
                <div className="w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${advancedMetrics.moodStabilityIndex}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="h-1.5 rounded-full bg-[#7B3FC4]"
                  />
                </div>
              )}
            </div>

            {/* Coping effectiveness */}
            <div>
              <span className="text-xs text-[#4B3F2F]">Coping effectiveness</span>
              {advancedMetrics?.copingEffectiveness?.difference != null ? (
                <div className="mt-1">
                  <span className={`text-sm font-bold ${advancedMetrics.copingEffectiveness.difference > 0 ? "text-green-600" : "text-gray-600"}`}>
                    {advancedMetrics.copingEffectiveness.difference > 0 ? "+" : ""}{advancedMetrics.copingEffectiveness.difference} mood pts
                  </span>
                  <div className="text-[10px] text-[#9a8e80] mt-0.5">
                    With coping: {advancedMetrics.copingEffectiveness.avgMoodWithCoping ?? "—"}/10 ·
                    Without: {advancedMetrics.copingEffectiveness.avgMoodWithoutCoping ?? "—"}/10
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#9a8e80] mt-0.5">Not enough data yet</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Recovery balance ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-[#e1ddd3] rounded-2xl shadow-sm p-5"
      >
        <h3 className="text-sm font-bold text-[#2E3A33] mb-1">Recovery balance</h3>
        <p className="text-[11px] text-[#9a8e80] mb-4">Both good and hard days are part of the process.</p>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
              className="text-3xl sm:text-4xl font-bold text-[#6CB28E]"
            >
              {totals.goodDays ?? 0}
            </motion.div>
            <div className="text-xs text-[#9a8e80] mt-1">Softer / good days</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-10 bg-[#e1ddd3]" />
            <span className="text-[10px] text-[#9a8e80]">vs</span>
            <div className="w-px h-10 bg-[#e1ddd3]" />
          </div>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.55 }}
              className="text-3xl sm:text-4xl font-bold text-[#E76F51]"
            >
              {totals.badDays ?? 0}
            </motion.div>
            <div className="text-xs text-[#9a8e80] mt-1">More challenging days</div>
          </div>
        </div>
      </motion.div>

      {/* ── Insight sections ── */}
      <div className="space-y-3">
        {[
          { key: "weekly", title: "Weekly insights", delay: 0.45 },
          { key: "monthly", title: "Monthly insights", delay: 0.5 },
          { key: "alltime", title: "All-time insights", delay: 0.55 },
        ].map(({ key, title, delay }) => (
          <InsightSection
            key={key}
            title={title}
            data={insights[key]}
            collapsed={collapsed[key]}
            onToggle={() => setCollapsed((s) => ({ ...s, [key]: !s[key] }))}
            delay={delay}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;