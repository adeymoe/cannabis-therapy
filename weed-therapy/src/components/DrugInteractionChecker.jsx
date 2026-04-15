// src/components/DrugInteractionChecker.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const severityConfig = {
  safe: {
    color: "text-[#2F7E57]",
    bg: "bg-[#EAF5EF] border-[#c6e3d1]",
    badge: "bg-[#6CB28E] text-white",
    icon: "✅",
    label: "No Known Interactions",
  },
  caution: {
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-200",
    badge: "bg-yellow-400 text-white",
    icon: "⚠️",
    label: "Use With Caution",
  },
  danger: {
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    badge: "bg-red-500 text-white",
    icon: "🚨",
    label: "Serious Interaction — Consult Doctor",
  },
};

export default function DrugInteractionChecker() {
  const [input, setInput] = useState("");
  const [medications, setMedications] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const token = localStorage.getItem("token");

  const addMedication = () => {
    const trimmed = input.trim();
    if (!trimmed || medications.includes(trimmed)) return;
    setMedications([...medications, trimmed]);
    setInput("");
    setResult(null);
  };

  const removeMedication = (med) => {
    setMedications(medications.filter((m) => m !== med));
    setResult(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addMedication(); }
  };

  const checkInteractions = async () => {
    if (medications.length === 0) { setError("Please add at least one medication."); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/interaction/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ medications }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Check failed");
      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/interaction/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHistory(data.data || []);
      setShowHistory(true);
    } catch {
      setError("Failed to load history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const config = result ? severityConfig[result.severity] : null;

  return (
    <div className="max-w-2xl mx-auto pb-10 space-y-4">

      {/* ── Disclaimer ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3 items-start"
      >
        <span className="text-lg flex-shrink-0">ℹ️</span>
        <p className="text-sm text-blue-700 leading-relaxed">
          <strong>Medical Disclaimer:</strong> This tool provides general information only. Always consult your doctor or pharmacist before combining cannabis with any medication.
        </p>
      </motion.div>

      {/* ── Input card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white border border-[#e1ddd3] rounded-2xl shadow-sm p-5"
      >
        <label className="block text-sm font-semibold text-[#2E3A33] mb-1">
          Enter Medication Name
        </label>
        <p className="text-xs text-[#9a8e80] mb-3">Add one or more medications to check their interaction with cannabis.</p>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Warfarin, Sertraline, Metoprolol..."
            className="flex-1 border border-[#e1ddd3] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E] focus:border-transparent bg-[#fdfcfa]"
          />
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={addMedication}
            className="bg-[#6CB28E] text-white px-4 py-3 rounded-2xl text-sm font-semibold hover:bg-[#5a9a7a] transition flex-shrink-0"
          >
            Add
          </motion.button>
        </div>

        {/* Medication tags */}
        <AnimatePresence>
          {medications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-wrap gap-2 mb-3"
            >
              {medications.map((med) => (
                <motion.span
                  key={med}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-[#EAF5EF] border border-[#c6e3d1] text-[#2E3A33] px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 font-medium"
                >
                  💊 {med}
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => removeMedication(med)}
                    className="text-[#9a8e80] hover:text-red-500 transition w-4 h-4 flex items-center justify-center font-bold text-base leading-none"
                  >
                    ×
                  </motion.button>
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-red-500 text-xs mb-3"
            >{error}</motion.p>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={checkInteractions}
          disabled={loading || medications.length === 0}
          className={`w-full py-4 rounded-2xl font-semibold text-sm transition shadow-sm ${
            loading || medications.length === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#6CB28E] to-[#5a9e7a] text-white"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Checking interactions...
            </span>
          ) : "Check Interactions"}
        </motion.button>
      </motion.div>

      {/* ── Result ── */}
      <AnimatePresence>
        {result && config && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-2xl border-2 p-5 ${config.bg}`}
          >
            <div className="flex items-start gap-3 mb-4">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-3xl flex-shrink-0"
              >{config.icon}</motion.span>
              <div>
                <p className={`text-base font-bold ${config.color}`}>{config.label}</p>
                <p className="text-sm text-[#4B3F2F] mt-1 leading-relaxed">{result.summary}</p>
              </div>
            </div>

            {result.interactions?.length > 0 && (
              <div className="space-y-3">
                {result.interactions.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="bg-white rounded-2xl p-4 border border-[#e1ddd3] shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-[#2E3A33] text-sm">{item.medication}</span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${severityConfig[item.severity]?.badge || "bg-gray-100 text-gray-600"}`}>
                        {item.severity?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-[#4B3F2F] leading-relaxed">{item.effect}</p>
                    <div className="flex items-start gap-1.5 mt-2">
                      <span className="text-sm">💡</span>
                      <p className="text-sm text-[#2F7E57] font-medium leading-relaxed">{item.recommendation}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-[#9a8e80] mt-4 italic">{result.disclaimer}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── History ── */}
      <div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={showHistory ? () => setShowHistory(false) : fetchHistory}
          className="flex items-center gap-2 text-sm text-[#6CB28E] font-medium hover:text-[#4a9e6b] transition"
        >
          {loadingHistory ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <motion.span animate={{ rotate: showHistory ? 180 : 0 }} transition={{ duration: 0.2 }}>▼</motion.span>
          )}
          {showHistory ? "Hide" : "View"} past checks
        </motion.button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3 space-y-3"
            >
              {history.length === 0 ? (
                <div className="text-center py-8 text-[#9a8e80]">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm">No past checks yet.</p>
                </div>
              ) : history.map((log, i) => {
                const c = severityConfig[log.result?.severity] || severityConfig.safe;
                return (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-[#e1ddd3] rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[#2E3A33] truncate">
                        💊 {log.medications.join(", ")}
                      </span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${c.badge}`}>
                        {c.icon} {log.result?.severity?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9a8e80] mt-1">
                      {new Date(log.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-[10px] text-[#9a8e80]">
        🔒 For harm reduction purposes only. Not medical advice.
      </p>
    </div>
  );
}