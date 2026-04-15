// src/components/DosePage.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const METHODS = [
  { id: "joint",    label: "Joint",    icon: "🚬", unit: "g" },
  { id: "vape",     label: "Vape",     icon: "💨", unit: "puffs" },
  { id: "edible",   label: "Edible",   icon: "🍪", unit: "mg" },
  { id: "tincture", label: "Tincture", icon: "💧", unit: "ml" },
  { id: "bong",     label: "Bong",     icon: "🫧", unit: "g" },
  { id: "dab",      label: "Dab",      icon: "🔥", unit: "g" },
];

const TABS = [
  { id: "log",     label: "Log Dose",  icon: "📝" },
  { id: "history", label: "History",   icon: "📋" },
  { id: "stats",   label: "Trends",    icon: "📊" },
];

const safetyColor = (score) => {
  if (score >= 8) return { bar: "bg-[#6CB28E]", text: "text-[#2F7E57]", bg: "bg-[#EAF5EF] border-[#c6e3d1]", label: "Safe" };
  if (score >= 5) return { bar: "bg-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", label: "Caution" };
  return              { bar: "bg-red-500",    text: "text-red-600",    bg: "bg-red-50 border-red-200",       label: "High Risk" };
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const DosePage = () => {
  const [method, setMethod]         = useState("joint");
  const [thcPotency, setThcPotency] = useState("");
  const [cbdPotency, setCbdPotency] = useState("");
  const [amount, setAmount]         = useState("");
  const [notes, setNotes]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);
  const [history, setHistory]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab]   = useState("log");
  const [error, setError]           = useState("");

  const selectedMethod = METHODS.find((m) => m.id === method);
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dose/history`, { headers });
      setHistory(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/dose/stats`, { headers });
      setStats(res.data.data || null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!thcPotency || !amount) { setError("THC % and amount are required."); return; }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/dose/log`,
        { method, thcPotency: Number(thcPotency), cbdPotency: Number(cbdPotency) || 0, amount: Number(amount), unit: selectedMethod.unit, notes },
        { headers }
      );
      setResult(res.data.data);
      setThcPotency(""); setCbdPotency(""); setAmount(""); setNotes("");
      fetchHistory(); fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to log dose.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/dose/${id}`, { headers });
      setHistory((prev) => prev.filter((l) => l._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">

      {/* ── Stats bar ── */}
      <AnimatePresence>
        {stats && stats.totalSessions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3 mb-5"
          >
            {[
              { label: "Sessions (7d)", value: stats.totalSessions, icon: "📊", color: "#6CB28E" },
              { label: "Avg Safety",    value: `${stats.avgSafetyScore}/10`, icon: "🛡️", color: "#2A9D8F" },
              { label: "Avg THC%",      value: `${stats.avgThc}%`, icon: "⚗️", color: "#E76F51" },
            ].map(({ label, value, icon, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl border border-[#e1ddd3] p-3 text-center shadow-sm"
              >
                <div className="text-lg mb-0.5">{icon}</div>
                <p className="text-base font-bold" style={{ color }}>{value}</p>
                <p className="text-[10px] text-[#9a8e80]">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab switcher ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex bg-[#f5f3ee] p-1.5 rounded-2xl mb-5"
      >
        {TABS.map(({ id, label, icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="relative flex-1 py-2 text-xs font-semibold rounded-xl transition-colors z-10 flex items-center justify-center gap-1"
              style={{ color: active ? "#2E3A33" : "#9a8e80" }}
            >
              {active && (
                <motion.div
                  layoutId="dose-tab"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{icon}</span>
              <span className="relative z-10 hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── LOG TAB ── */}
        {activeTab === "log" && (
          <motion.div
            key="log"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="bg-white border border-[#e1ddd3] rounded-2xl shadow-sm p-5 space-y-5"
          >
            {/* Method picker */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#7A6C58] mb-2">Consumption Method</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {METHODS.map((m) => (
                  <motion.button
                    key={m.id}
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border text-xs font-semibold transition ${
                      method === m.id
                        ? "bg-[#6CB28E] border-[#6CB28E] text-white shadow-sm"
                        : "bg-[#f9f7f3] border-[#e1ddd3] text-[#2E3A33] hover:border-[#6CB28E]"
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="text-[10px]">{m.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* THC + CBD */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#4a4a4a] block mb-1.5">
                    THC % <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={thcPotency}
                    onChange={(e) => setThcPotency(e.target.value)}
                    placeholder="e.g. 22"
                    className="w-full border border-[#e1ddd3] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E] bg-[#fdfcfa]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#4a4a4a] block mb-1.5">
                    CBD % <span className="text-[#9a8e80] font-normal">(optional)</span>
                  </label>
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={cbdPotency}
                    onChange={(e) => setCbdPotency(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full border border-[#e1ddd3] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E] bg-[#fdfcfa]"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-[#4a4a4a] block mb-1.5">
                  Amount ({selectedMethod?.unit}) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number" min="0" step="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Amount in ${selectedMethod?.unit}`}
                  className="w-full border border-[#e1ddd3] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E] bg-[#fdfcfa]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-[#4a4a4a] block mb-1.5">
                  Notes <span className="text-[#9a8e80] font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling? Any context..."
                  rows={2}
                  className="w-full border border-[#e1ddd3] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E] resize-none bg-[#fdfcfa]"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-red-500 text-xs">{error}</motion.p>
                )}
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-2xl font-semibold text-sm shadow-sm transition ${
                  submitting ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#6CB28E] to-[#5a9e7a] text-white"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Logging & Analysing...
                  </span>
                ) : "💾 Log Dose"}
              </motion.button>
            </form>

            {/* Result */}
            <AnimatePresence>
              {result && (() => {
                const c = safetyColor(result.safetyScore);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl border-2 p-4 ${c.bg}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={`font-bold text-sm ${c.text}`}>
                        Safety Score: {result.safetyScore}/10 — {c.label}
                      </p>
                      <span className="text-xs text-[#9a8e80]">
                        {METHODS.find((m) => m.id === result.method)?.icon} {result.method}
                      </span>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-2 mb-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.safetyScore * 10}%` }}
                        transition={{ duration: 0.6 }}
                        className={`h-2 rounded-full ${c.bar}`}
                      />
                    </div>
                    <div className="flex gap-2 bg-white rounded-2xl p-3 border border-[#e1ddd3]">
                      <span className="text-lg flex-shrink-0">🤖</span>
                      <p className="text-xs text-[#4a5568] leading-relaxed">{result.aiFeedback}</p>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="bg-white border border-[#e1ddd3] rounded-2xl shadow-sm p-5"
          >
            <h2 className="font-bold text-[#2E3A33] mb-4">Session History</h2>
            {loadingHistory ? (
              <div className="flex flex-col items-center gap-2 py-10">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-[#6CB28E]"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 text-[#9a8e80]">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm">No sessions logged yet.</p>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveTab("log")}
                  className="mt-3 text-xs text-[#6CB28E] font-medium underline">
                  Log your first dose →
                </motion.button>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((log, i) => {
                  const c = safetyColor(log.safetyScore);
                  const m = METHODS.find((x) => x.id === log.method);
                  return (
                    <motion.div
                      key={log._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-2xl border border-[#e1ddd3] p-4 bg-[#f9f7f3] flex gap-3"
                    >
                      <span className="text-2xl flex-shrink-0">{m?.icon || "🌿"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-semibold text-sm text-[#2E3A33] capitalize">{log.method}</p>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.bg} ${c.text}`}>
                            {log.safetyScore}/10
                          </span>
                        </div>
                        <p className="text-xs text-[#9a8e80]">
                          THC {log.thcPotency}% · {log.amount} {log.unit}
                          {log.cbdPotency > 0 && ` · CBD ${log.cbdPotency}%`}
                        </p>
                        {log.aiFeedback && (
                          <p className="text-xs text-[#4a5568] mt-1 italic line-clamp-2">{log.aiFeedback}</p>
                        )}
                        <p className="text-[10px] text-[#9a8e80] mt-1">{formatDate(log.createdAt)}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleDelete(log._id)}
                        className="text-[#c0b9b0] hover:text-red-400 transition text-xl flex-shrink-0 self-start leading-none"
                      >×</motion.button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === "stats" && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="bg-white border border-[#e1ddd3] rounded-2xl shadow-sm p-5"
          >
            <h2 className="font-bold text-[#2E3A33] mb-4">7-Day Safety Trend</h2>

            {!stats || stats.totalSessions === 0 ? (
              <div className="text-center py-10 text-[#9a8e80]">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm">Log at least one session to see trends.</p>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveTab("log")}
                  className="mt-3 text-xs text-[#6CB28E] font-medium underline">
                  Log your first dose →
                </motion.button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-2xl bg-[#EAF5EF] border border-[#c6e3d1] p-3 text-center">
                    <p className="text-base font-bold text-[#2E3A33]">{stats.mostUsedMethod}</p>
                    <p className="text-[11px] text-[#9a8e80]">Most Used Method</p>
                  </div>
                  <div className="rounded-2xl bg-[#EAF5EF] border border-[#c6e3d1] p-3 text-center">
                    <p className="text-base font-bold text-[#2E3A33]">{stats.avgThc}%</p>
                    <p className="text-[11px] text-[#9a8e80]">Avg THC Potency</p>
                  </div>
                </div>

                <p className="text-xs font-bold uppercase tracking-wide text-[#9a8e80] mb-3">Safety Score Per Session</p>
                <div className="space-y-2.5">
                  {stats.safetyTrend.map((entry, i) => {
                    const c = safetyColor(entry.safetyScore);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] text-[#9a8e80] w-20 flex-shrink-0">{entry.date}</span>
                        <div className="flex-1 bg-[#f0ebe1] rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${entry.safetyScore * 10}%` }}
                            transition={{ duration: 0.5, delay: i * 0.06 }}
                            className={`h-3 rounded-full ${c.bar}`}
                          />
                        </div>
                        <span className={`text-xs font-bold w-6 text-right ${c.text}`}>{entry.safetyScore}</span>
                      </div>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-4"
                >
                  <p className="text-xs text-amber-800 leading-relaxed">
                    📚 <strong>Did you know?</strong> Today's cannabis is 5–10× stronger than decades ago. Tracking your potency helps you stay within safe limits and avoid accidental overconsumption.
                  </p>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[10px] text-[#9a8e80] mt-4">
        🔒 For harm reduction purposes only. This is not medical advice.
      </p>
    </div>
  );
};

export default DosePage;