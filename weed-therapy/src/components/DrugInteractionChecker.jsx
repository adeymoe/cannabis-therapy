import { useState } from "react";
import Header from "./Header";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const severityConfig = {
  safe: {
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-700",
    icon: "✅",
    label: "No Known Interactions",
  },
  caution: {
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
    icon: "⚠️",
    label: "Use With Caution",
  },
  danger: {
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700",
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

  const token = localStorage.getItem("token");

  const addMedication = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (medications.includes(trimmed)) return;
    setMedications([...medications, trimmed]);
    setInput("");
  };

  const removeMedication = (med) => {
    setMedications(medications.filter((m) => m !== med));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") addMedication();
  };

  const checkInteractions = async () => {
    if (medications.length === 0) {
      setError("Please add at least one medication.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/interaction/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
    try {
      const res = await fetch(`${BACKEND_URL}/api/interaction/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHistory(data.data || []);
      setShowHistory(true);
    } catch {
      setError("Failed to load history.");
    }
  };

  const config = result ? severityConfig[result.severity] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">💊 Drug Interaction Checker</h1>
          <p className="text-gray-500 text-sm mt-1">
            Check if your medications interact with cannabis (THC/CBD).
          </p>
        </div>

        {/* Disclaimer Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
          ℹ️ <strong>Medical Disclaimer:</strong> This tool provides general information only. Always
          consult your doctor or pharmacist before combining cannabis with any medication.
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Medication Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Warfarin, Sertraline, Metoprolol..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              onClick={addMedication}
              className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition"
            >
              Add
            </button>
          </div>

          {/* Medication Tags */}
          {medications.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {medications.map((med) => (
                <span
                  key={med}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {med}
                  <button
                    onClick={() => removeMedication(med)}
                    className="text-gray-400 hover:text-red-500 ml-1 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <button
            onClick={checkInteractions}
            disabled={loading}
            className="mt-4 w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50"
          >
            {loading ? "Checking interactions..." : "Check Interactions"}
          </button>
        </div>

        {/* Result */}
        {result && config && (
          <div className={`rounded-2xl border p-6 mb-6 ${config.bg}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{config.icon}</span>
              <div>
                <span className={`text-lg font-bold ${config.color}`}>{config.label}</span>
                <p className="text-gray-600 text-sm mt-1">{result.summary}</p>
              </div>
            </div>

            {result.interactions && result.interactions.length > 0 && (
              <div className="space-y-3 mt-4">
                {result.interactions.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800">{item.medication}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          severityConfig[item.severity]?.badge || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.severity?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{item.effect}</p>
                    <p className="text-sm text-green-700 mt-1 font-medium">
                      💡 {item.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-4 italic">{result.disclaimer}</p>
          </div>
        )}

        {/* History Button */}
        <button
          onClick={fetchHistory}
          className="text-sm text-green-600 underline hover:text-green-700"
        >
          View past checks
        </button>

        {/* History List */}
        {showHistory && history.length > 0 && (
          <div className="mt-4 space-y-3">
            {history.map((log) => {
              const c = severityConfig[log.result?.severity] || severityConfig.safe;
              return (
                <div
                  key={log._id}
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {log.medications.join(", ")}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.badge}`}>
                      {c.icon} {log.result?.severity?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}