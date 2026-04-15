// src/components/CheckinPage.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const METRICS = [
  {
    name: "mood",
    label: "Mood",
    icon: "😊",
    minLabel: "Very low",
    maxLabel: "Very high",
    color: "#6CB28E",
    gradient: "from-[#E9F7F0] to-[#fdfcfa]",
    track: "bg-[#6CB28E]",
  },
  {
    name: "craving",
    label: "Cannabis Craving",
    icon: "🔥",
    minLabel: "No craving",
    maxLabel: "Intense",
    color: "#E76F51",
    gradient: "from-[#FFEDE7] to-[#fdfcfa]",
    track: "bg-[#E76F51]",
  },
  {
    name: "stress",
    label: "Stress",
    icon: "⚡",
    minLabel: "No stress",
    maxLabel: "Very stressed",
    color: "#F4A261",
    gradient: "from-[#FFF3E3] to-[#fdfcfa]",
    track: "bg-[#F4A261]",
  },
  {
    name: "energy",
    label: "Energy",
    icon: "⚡",
    minLabel: "Exhausted",
    maxLabel: "Energized",
    color: "#2A9D8F",
    gradient: "from-[#E8F6F5] to-[#fdfcfa]",
    track: "bg-[#2A9D8F]",
  },
];

const COPING_OPTIONS = [
  { label: "Breathing", emoji: "🌬️" },
  { label: "Exercise", emoji: "🏃" },
  { label: "Journaling", emoji: "📓" },
  { label: "Meditation", emoji: "🧘" },
  { label: "Talking to friend", emoji: "💬" },
  { label: "Nature walk", emoji: "🌿" },
];

// ── Tap-friendly value selector ───────────────────────────────────────────────
const ValueSelector = ({ name, value, color, track, disabled, onChange }) => {
  const dots = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <div className="mt-3">
      <div className="flex justify-between gap-1">
        {dots.map((n) => {
          const active = n <= value;
          const isSelected = n === value;
          return (
            <motion.button
              key={n}
              type="button"
              disabled={disabled}
              whileTap={{ scale: disabled ? 1 : 0.85 }}
              onClick={() => !disabled && onChange({ target: { name, value: String(n) } })}
              className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-all ${
                isSelected
                  ? "text-white shadow-md"
                  : active
                  ? "text-white/80"
                  : "bg-[#f0ebe1] text-[#b0a898]"
              } ${disabled ? "cursor-default" : "cursor-pointer"}`}
              style={active ? { backgroundColor: color, opacity: isSelected ? 1 : 0.5 + n * 0.05 } : {}}
            >
              {n}
            </motion.button>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-[#9a8e80] mt-1.5 px-0.5">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
};

// ── Metric Card ───────────────────────────────────────────────────────────────
const MetricCard = ({ metric, value, disabled, onChange }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-gradient-to-br ${metric.gradient} border border-[#e1ddd3] rounded-2xl p-4 sm:p-5`}
  >
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">{metric.icon}</span>
        <p className="text-sm font-semibold text-[#2E3A33]">{metric.label}</p>
      </div>
      <motion.span
        key={value}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-lg font-bold"
        style={{ color: metric.color }}
      >
        {value}
        <span className="text-xs font-normal text-[#9a8e80]">/10</span>
      </motion.span>
    </div>
    <ValueSelector
      name={metric.name}
      value={value}
      color={metric.color}
      track={metric.track}
      disabled={disabled}
      onChange={onChange}
    />
  </motion.div>
);

// ── Summary Metric Pill ───────────────────────────────────────────────────────
const MetricPill = ({ label, value, color, icon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="rounded-2xl border border-[#e1ddd3] bg-white px-3 py-3 text-center flex flex-col items-center gap-1"
  >
    <span className="text-xl">{icon}</span>
    <p className="text-[11px] text-[#7A6C58]">{label}</p>
    <p className="text-base font-bold" style={{ color }}>{value}<span className="text-xs font-normal text-[#9a8e80]">/10</span></p>
  </motion.div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const CheckinPage = () => {
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    mood: 5,
    craving: 5,
    stress: 5,
    energy: 5,
    notes: "",
    copingActivities: [],
  });

  const getTodayKey = () => {
    const today = new Date().toISOString().slice(0, 10);
    return `weedtherapy_checkin_prompt_${today}`;
  };

  useEffect(() => {
    const fetchTodayCheckin = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/auth"); return; }
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/checkin/today`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success && res.data.checkin) {
          const c = res.data.checkin;
          setTodayCheckin(c);
          setForm({
            mood: c.mood, craving: c.craving, stress: c.stress,
            energy: c.energy || 5, notes: c.notes || "",
            copingActivities: c.copingActivities || [],
          });
        }
      } catch (error) {
        if (error.response?.status === 401) { localStorage.removeItem("token"); navigate("/auth"); }
        toast.error("Failed to load check-in data");
      } finally {
        setLoading(false);
      }
    };
    fetchTodayCheckin();
  }, [navigate]);

  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      let res;
      const payload = {
        mood: form.mood, craving: form.craving, stress: form.stress,
        energy: form.energy, notes: form.notes, copingActivities: form.copingActivities,
      };
      if (todayCheckin && isEditing) {
        res = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/api/checkin/update/${todayCheckin._id}`,
          payload, { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Check-in updated!");
        setTodayCheckin(res.data.checkin || todayCheckin);
      } else if (!todayCheckin) {
        res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/checkin/create`,
          payload, { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Check-in saved! 🌱");
        setTodayCheckin(res.data.checkin);
      }
      localStorage.setItem(getTodayKey(), "done");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to save check-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    if (todayCheckin) {
      setForm({
        mood: todayCheckin.mood, craving: todayCheckin.craving,
        stress: todayCheckin.stress, energy: todayCheckin.energy || 5,
        notes: todayCheckin.notes || "", copingActivities: todayCheckin.copingActivities || [],
      });
    }
    setIsEditing(false);
  };

  const canEdit = todayCheckin && !isEditing;
  const showForm = !todayCheckin || isEditing;

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
          <p className="text-sm text-[#7A6C58] mt-1">Loading your check-in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-10">

      {/* ── Intro card ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 bg-gradient-to-br from-[#EAF5EF] to-white border border-[#c6e3d1] rounded-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#6CB28E] flex items-center justify-center text-xl flex-shrink-0">📓</div>
          <div>
            <h2 className="text-base font-semibold text-[#2E3A33] mb-0.5">How are you feeling today?</h2>
            <p className="text-xs text-[#7A6C58] leading-relaxed">
              Tap a number for each dimension. Your AI therapist uses these patterns to personalise your support.
            </p>
          </div>
        </div>

        <AnimatePresence>
          {todayCheckin && !isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 flex items-center gap-2"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6CB28E] text-white text-xs font-medium">
                ✓ Completed today
              </span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-[#c6e3d1] text-[#2E3A33] text-xs font-medium hover:bg-[#EAF5EF] transition"
              >
                ✏️ Edit
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Summary view ── */}
      <AnimatePresence>
        {canEdit && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white border border-[#e1ddd3] rounded-2xl p-5 mb-5 shadow-sm"
          >
            <h3 className="font-semibold text-[#2E3A33] mb-3 text-sm">Today at a glance</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {METRICS.map((m) => (
                <MetricPill
                  key={m.name}
                  label={m.label.split(" ")[0]}
                  value={todayCheckin[m.name] || 5}
                  color={m.color}
                  icon={m.icon}
                />
              ))}
            </div>

            {todayCheckin.copingActivities?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-[#7A6C58] mb-1.5">Coping activities</p>
                <div className="flex flex-wrap gap-1.5">
                  {todayCheckin.copingActivities.map((a) => {
                    const opt = COPING_OPTIONS.find(o => o.label.toLowerCase() === a);
                    return (
                      <span key={a} className="px-2.5 py-1 rounded-full bg-[#EAF5EF] border border-[#c6e3d1] text-xs text-[#2E3A33] flex items-center gap-1">
                        {opt?.emoji} {a.charAt(0).toUpperCase() + a.slice(1)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {todayCheckin.notes && (
              <div className="mb-3">
                <p className="text-xs font-medium text-[#7A6C58] mb-1">Notes</p>
                <div className="text-xs text-[#4B3F2F] bg-[#fdfcfa] border border-[#e1ddd3] rounded-xl px-3 py-2 leading-relaxed">
                  {todayCheckin.notes}
                </div>
              </div>
            )}

            {todayCheckin.summary && (
              <div className="rounded-xl bg-[#EAF5EF] border border-[#c6e3d1] p-3">
                <p className="text-xs font-semibold text-[#2F7E57] mb-1.5">🌱 AI Reflection</p>
                <p className="text-xs text-[#2E3A33] leading-relaxed">
                  <span className="font-medium">Emotional state: </span>{todayCheckin.summary.emotionalState}
                </p>
                <p className="text-xs text-[#2E3A33] leading-relaxed mt-1">
                  <span className="font-medium">Suggestion: </span>{todayCheckin.summary.suggestion}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Metric cards */}
            {METRICS.map((metric, i) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <MetricCard
                  metric={metric}
                  value={form[metric.name]}
                  disabled={todayCheckin && !isEditing}
                  onChange={handleSliderChange}
                />
              </motion.div>
            ))}

            {/* Coping activities */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="bg-white border border-[#e1ddd3] rounded-2xl p-5"
            >
              <p className="text-sm font-semibold text-[#2E3A33] mb-0.5">
                Coping activities today
                <span className="text-xs font-normal text-[#9a8e80] ml-1">(optional)</span>
              </p>
              <p className="text-xs text-[#7A6C58] mb-3">What helped you most today?</p>
              <div className="grid grid-cols-3 gap-2">
                {COPING_OPTIONS.map(({ label, emoji }) => {
                  const val = label.toLowerCase();
                  const selected = form.copingActivities.includes(val);
                  return (
                    <motion.button
                      key={label}
                      type="button"
                      whileTap={{ scale: 0.93 }}
                      disabled={todayCheckin && !isEditing}
                      onClick={() => {
                        if (todayCheckin && !isEditing) return;
                        setForm((prev) => ({
                          ...prev,
                          copingActivities: selected
                            ? prev.copingActivities.filter((a) => a !== val)
                            : [...prev.copingActivities, val],
                        }));
                      }}
                      className={`flex flex-col items-center gap-1 py-3 rounded-2xl border text-xs font-medium transition ${
                        selected
                          ? "bg-[#6CB28E] text-white border-[#6CB28E] shadow-sm"
                          : "bg-[#fdfcfa] text-[#4B3F2F] border-[#e1ddd3] hover:bg-[#EAF5EF]"
                      } ${todayCheckin && !isEditing ? "opacity-60" : ""}`}
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className="text-[10px] text-center leading-tight">{label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Notes */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
              className="bg-white border border-[#e1ddd3] rounded-2xl p-5"
            >
              <label className="block text-sm font-semibold text-[#2E3A33] mb-0.5">
                Notes
                <span className="text-xs font-normal text-[#9a8e80] ml-1">(optional)</span>
              </label>
              <p className="text-xs text-[#7A6C58] mb-2">Triggers, wins, thoughts for today?</p>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                disabled={todayCheckin && !isEditing}
                placeholder="e.g. Woke up anxious, cravings higher after work. Took a short walk instead."
                className="w-full min-h-[88px] p-3 border border-[#e1ddd3] rounded-xl focus:ring-2 focus:ring-[#6CB28E] focus:border-transparent text-sm bg-[#fdfcfa] disabled:opacity-60 resize-none transition"
              />
            </motion.div>

            {/* Submit buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2 pb-2"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-2xl text-sm font-semibold text-white shadow-sm transition ${
                  submitting
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#6CB28E] to-[#5a9e7a] hover:from-[#5FA47F] hover:to-[#4e8f6c]"
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Saving...
                  </span>
                ) : todayCheckin && isEditing ? "Update Check-In" : "Save Today's Check-In 🌱"}
              </motion.button>

              {isEditing && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full py-3 rounded-2xl text-sm font-medium bg-white border border-[#e1ddd3] text-[#7A6C58] hover:bg-[#f5f3ee] transition"
                >
                  Cancel
                </motion.button>
              )}
            </motion.div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckinPage;