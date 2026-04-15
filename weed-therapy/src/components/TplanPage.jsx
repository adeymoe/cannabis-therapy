// src/components/TplanPage.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

// ─── Circular Progress Ring ───────────────────────────────────────────────────
const RingProgress = ({ percent, size = 160, stroke = 12, color = "#4ade80", label, sublabel }) => {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2937" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white font-bold text-2xl leading-none"
        >{percent}%</motion.span>
        {label    && <span className="text-zinc-400 text-xs mt-1">{label}</span>}
        {sublabel && <span className="text-zinc-500 text-xs">{sublabel}</span>}
      </div>
    </div>
  );
};

const StreakBadge = ({ streak }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
    className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/40 rounded-full px-3 py-1"
  >
    <span className="text-base">🔥</span>
    <span className="text-orange-300 font-bold text-sm">{streak} day streak</span>
  </motion.div>
);

const StatCard = ({ icon, label, value, color = "text-white", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-zinc-900/80 border border-zinc-700/50 rounded-2xl p-4 flex flex-col gap-1 backdrop-blur-sm"
  >
    <span className="text-xl">{icon}</span>
    <span className={`font-bold text-xl ${color}`}>{value}</span>
    <span className="text-zinc-400 text-xs">{label}</span>
  </motion.div>
);

const feedItems = [
  { type: "article", emoji: "🧠", tag: "Science",      title: "Why your brain craves weed after stress",    desc: "The endocannabinoid system plays a key role in how we respond to stress. Understanding it helps you break the cycle.",          time: "3 min read",     color: "from-blue-900/40 to-zinc-900/40",    border: "border-blue-700/30" },
  { type: "movie",   emoji: "🎬", tag: "Watch Tonight", title: "The Social Dilemma",                        desc: "A gripping documentary that will keep your mind engaged and away from cravings for 90 minutes.",                           time: "Netflix · 89 min", color: "from-purple-900/40 to-zinc-900/40",  border: "border-purple-700/30" },
  { type: "tip",     emoji: "💡", tag: "Coping Tip",    title: "The 5-4-3-2-1 grounding technique",         desc: "When a craving hits: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",                      time: "1 min read",     color: "from-green-900/40 to-zinc-900/40",   border: "border-green-700/30" },
  { type: "movie",   emoji: "🎮", tag: "Distraction",   title: "Try a 20-min gaming session",               desc: "Short gaming sessions activate dopamine pathways and can effectively replace craving urges.",                             time: "Activity · 20 min", color: "from-yellow-900/40 to-zinc-900/40", border: "border-yellow-700/30" },
  { type: "article", emoji: "💰", tag: "Motivation",    title: "How much money are you actually saving?",   desc: "Users who reduce by 50% save an average of £180/month. That's a weekend trip every 2 months.",                            time: "2 min read",     color: "from-emerald-900/40 to-zinc-900/40", border: "border-emerald-700/30" },
];

const FeedCard = ({ item, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className={`bg-gradient-to-br ${item.color} border ${item.border} rounded-2xl p-4 flex gap-3 shrink-0`}
    style={{ width: 260 }}
  >
    <div className="text-2xl mt-0.5">{item.emoji}</div>
    <div className="flex-1 min-w-0">
      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{item.tag}</span>
      <p className="text-white text-sm font-semibold mt-0.5 leading-snug">{item.title}</p>
      <p className="text-zinc-400 text-xs mt-1 leading-relaxed line-clamp-2">{item.desc}</p>
      <span className="text-zinc-500 text-xs mt-2 block">{item.time}</span>
    </div>
  </motion.div>
);

const BADGE_DEFS = [
  { id: "first_log",    emoji: "📝", label: "First Log",     desc: "Logged your first day",        threshold: (logs)                              => logs >= 1 },
  { id: "streak_3",    emoji: "🔥", label: "3-Day Streak",  desc: "3 days in a row",              threshold: (_, streak)                         => streak >= 3 },
  { id: "streak_7",    emoji: "⚡", label: "Week Warrior",  desc: "7-day streak",                 threshold: (_, streak)                         => streak >= 7 },
  { id: "week_1",      emoji: "🌱", label: "Week 1 Done",   desc: "Completed week 1",             threshold: (_, __, week)                       => week > 1 },
  { id: "under_target",emoji: "🎯", label: "On Target",     desc: "Stayed under target 5 days",   threshold: (logs)                              => logs >= 5 },
  { id: "saved_20",    emoji: "💰", label: "Saved £20",     desc: "Reduced enough to save £20",   threshold: (_, __, ___, saved)                 => saved >= 20 },
  { id: "halfway",     emoji: "🏁", label: "Halfway There", desc: "Reached 50% of plan",          threshold: (_, __, ___, ____, progress)        => progress >= 50 },
  { id: "complete",    emoji: "🏆", label: "Plan Complete", desc: "Finished your full plan",      threshold: (_, __, ___, ____, progress)        => progress >= 100 },
];

const ReminderToggles = () => {
  const [reminders, setReminders] = useState([
    { id: "morning", label: "Morning check-in",     time: "9:00 AM",  active: true },
    { id: "evening", label: "Evening log reminder", time: "8:00 PM",  active: true },
    { id: "weekly",  label: "Weekly insight report", time: "Sundays", active: false },
  ]);
  const toggle = (id) => setReminders(r => r.map(x => x.id === id ? { ...x, active: !x.active } : x));
  return (
    <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-2xl p-4">
      <p className="text-white font-semibold text-sm mb-3">🔔 Daily Reminders</p>
      <div className="space-y-2">
        {reminders.map(r => (
          <div key={r.id} className="flex items-center justify-between bg-zinc-800/60 rounded-xl px-4 py-3">
            <div>
              <p className="text-white text-sm">{r.label}</p>
              <p className="text-zinc-500 text-xs">{r.time}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => toggle(r.id)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${r.active ? "bg-green-600" : "bg-zinc-700"}`}
            >
              <motion.div
                animate={{ x: r.active ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
              />
            </motion.button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Quick Log Modal ──────────────────────────────────────────────────────────
const QuickLogModal = ({ plan, onClose, onLogged }) => {
  const token = localStorage.getItem("token");
  const [usage,   setUsage]   = useState("");
  const [notes,   setNotes]   = useState("");
  const [mood,    setMood]    = useState("okay");
  const [logging, setLogging] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const moods = [
    { val: "great",   emoji: "😄", label: "Great" },
    { val: "okay",    emoji: "😐", label: "Okay" },
    { val: "tough",   emoji: "😔", label: "Tough" },
    { val: "craving", emoji: "😤", label: "Craving" },
  ];

  const handleLog = async () => {
    if (!usage) return;
    setLogging(true);
    setError("");
    try {
      const { data } = await axios.post(
        `${API}/api/tplan/log`,
        { actualUsage: Number(usage), notes, mood, source: "manual" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setSuccess(true);
        setTimeout(() => { onLogged(); onClose(); }, 1200);
      } else {
        setError(data.message || "Failed to log.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server error.");
    } finally {
      setLogging(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-t-3xl p-6 pb-10 space-y-5"
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center -mt-2 mb-1">
            <div className="w-10 h-1 bg-zinc-700 rounded-full" />
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6 gap-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-5xl"
                >✅</motion.div>
                <p className="text-white font-semibold text-lg">Logged! Keep going 💪</p>
              </motion.div>
            ) : (
              <motion.div key="form" className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-lg">Log Today's Usage</h3>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white">✕</motion.button>
                </div>

                {error && <p className="text-red-400 text-xs text-center">{error}</p>}

                <div>
                  <p className="text-zinc-400 text-xs mb-2">How are you feeling?</p>
                  <div className="flex gap-2">
                    {moods.map(m => (
                      <motion.button
                        key={m.val}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setMood(m.val)}
                        className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl border transition text-xs ${
                          mood === m.val
                            ? "bg-green-600/30 border-green-500 text-green-300"
                            : "bg-zinc-800 border-zinc-700 text-zinc-400"
                        }`}
                      >
                        <span className="text-xl">{m.emoji}</span>
                        <span className="mt-0.5">{m.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-zinc-400 text-xs mb-2">
                    How many {plan?.goal?.unit || "sessions"} today?
                    {plan && <span className="ml-2 text-green-400">Target: ≤ {plan.weeklyTargets?.[plan.currentWeek - 1]?.targetPerDay ?? "—"}</span>}
                  </p>
                  <div className="flex gap-3 items-center">
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => setUsage(v => String(Math.max(0, Number(v) - 0.5)))}
                      className="w-11 h-11 rounded-2xl bg-zinc-800 border border-zinc-700 text-white text-xl font-bold flex items-center justify-center">−</motion.button>
                    <input type="number" value={usage} onChange={e => setUsage(e.target.value)}
                      placeholder="0" min="0" step="0.5"
                      className="flex-1 bg-zinc-800 text-white text-center text-2xl font-bold rounded-2xl py-3 outline-none focus:ring-2 focus:ring-green-500 border border-zinc-700" />
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => setUsage(v => String(Number(v) + 0.5))}
                      className="w-11 h-11 rounded-2xl bg-zinc-800 border border-zinc-700 text-white text-xl font-bold flex items-center justify-center">+</motion.button>
                  </div>
                </div>

                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Any notes? (e.g. stressful day, social event)"
                  className="w-full bg-zinc-800 text-white rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 border border-zinc-700" />

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLog}
                  disabled={!usage || logging}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition text-base"
                >
                  {logging ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Saving...
                    </span>
                  ) : "Log Usage ✓"}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Setup View ───────────────────────────────────────────────────────────────
const SetupView = ({ onPlanCreated }) => {
  const token = localStorage.getItem("token");
  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState({ currentUsage: "", targetUsage: "0", unit: "sessions", durationWeeks: "8", reason: "" });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [direction, setDirection] = useState(1);

  const steps = [
    { title: "Current usage", subtitle: "How much do you use per day right now?" },
    { title: "Your goal",     subtitle: "What would you like to reduce to?" },
    { title: "Your why",      subtitle: "What's motivating you? (optional)" },
  ];

  const handleGenerate = async () => {
    setError("");
    if (!form.currentUsage || Number(form.currentUsage) <= 0) return setError("Enter your current usage first.");
    if (Number(form.targetUsage) >= Number(form.currentUsage)) return setError("Target must be less than current usage.");
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${API}/api/tplan/create`,
        { currentUsage: Number(form.currentUsage), targetUsage: Number(form.targetUsage), unit: form.unit, durationWeeks: Number(form.durationWeeks), reason: form.reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) setPreview(data.plan);
      else setError(data.message || "Failed to create plan.");
    } catch (err) {
      setError(err.response?.data?.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goNext = (nextStep) => { setDirection(1); setStep(nextStep); };
  const goBack = (prevStep) => { setDirection(-1); setStep(prevStep); };

  if (preview) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/30 border border-green-700/50 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-2xl">✨</motion.span>
          <span className="text-green-300 font-semibold text-sm">Your AI Therapist</span>
        </div>
        <p className="text-white text-sm leading-relaxed">{preview.aiRefinement}</p>
      </div>

      <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-3xl p-5">
        <p className="text-zinc-400 text-xs mb-4 uppercase tracking-wide font-semibold">Your {preview.goal.durationWeeks}-Week Journey</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-zinc-800 rounded-2xl p-4 text-center">
            <p className="text-zinc-500 text-xs">Starting</p>
            <p className="text-white font-bold text-3xl">{preview.goal.currentUsage}</p>
            <p className="text-zinc-400 text-xs">{preview.goal.unit}/day</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-0.5 bg-green-500" /><span className="text-green-400 text-lg">→</span><div className="w-8 h-0.5 bg-green-500" />
          </div>
          <div className="flex-1 bg-green-900/40 border border-green-700/50 rounded-2xl p-4 text-center">
            <p className="text-zinc-500 text-xs">Goal</p>
            <p className="text-green-400 font-bold text-3xl">{preview.goal.targetUsage}</p>
            <p className="text-zinc-400 text-xs">{preview.goal.unit}/day</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-3xl p-5">
        <p className="text-zinc-400 text-xs mb-3 uppercase tracking-wide font-semibold">Week-by-Week Schedule</p>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {preview.weeklyTargets.map((wk, i) => (
            <motion.div key={wk.week} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 bg-zinc-800/60 rounded-xl p-3">
              <div className="w-8 h-8 rounded-full bg-green-700/50 border border-green-600/50 flex items-center justify-center shrink-0">
                <span className="text-green-300 text-xs font-bold">{wk.week}</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">Max <span className="text-green-400 font-bold">{wk.targetPerDay}</span> {preview.goal.unit}/day</p>
                {wk.notes && <p className="text-zinc-500 text-xs mt-0.5">💡 {wk.notes}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => onPlanCreated(preview)}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-900/30">
        Start My Journey 🌿
      </motion.button>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Step dots */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((_, i) => (
          <motion.div key={i}
            animate={{ width: i === step ? 24 : 8, backgroundColor: i <= step ? "#22c55e" : "#3f3f46" }}
            className="h-2 rounded-full"
          />
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          <div className="text-center">
            <h2 className="text-white font-bold text-xl">{steps[step].title}</h2>
            <p className="text-zinc-400 text-sm mt-1">{steps[step].subtitle}</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm rounded-2xl p-3 text-center">{error}</motion.div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-2xl p-5 space-y-4">
                <div>
                  <label className="text-zinc-400 text-xs block mb-2">Daily usage amount</label>
                  <div className="flex gap-2">
                    <input type="number" value={form.currentUsage} onChange={e => setForm({ ...form, currentUsage: e.target.value })}
                      placeholder="e.g. 5" min="1"
                      className="flex-1 bg-zinc-800 text-white rounded-2xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-green-500 border border-zinc-700" />
                    <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                      className="bg-zinc-800 text-white rounded-2xl px-3 py-3 text-sm outline-none border border-zinc-700">
                      <option value="sessions">sessions</option>
                      <option value="joints">joints</option>
                      <option value="mg">mg</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-zinc-400 text-xs block mb-2">Plan duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["4", "8", "12"].map(w => (
                      <motion.button key={w} whileTap={{ scale: 0.95 }} onClick={() => setForm({ ...form, durationWeeks: w })}
                        className={`py-2.5 rounded-2xl text-sm font-semibold border transition ${
                          form.durationWeeks === w ? "bg-green-600 border-green-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400"
                        }`}>{w} weeks</motion.button>
                    ))}
                  </div>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { if (!form.currentUsage) return setError("Enter your current usage."); setError(""); goNext(1); }}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl transition">Continue →</motion.button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-2xl p-5">
                <label className="text-zinc-400 text-xs block mb-2">Target daily usage (0 = quit completely)</label>
                <div className="flex gap-3 items-center">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setForm(f => ({ ...f, targetUsage: String(Math.max(0, Number(f.targetUsage) - 0.5)) }))}
                    className="w-12 h-12 rounded-2xl bg-zinc-800 text-white text-2xl font-bold flex items-center justify-center border border-zinc-700">−</motion.button>
                  <input type="number" value={form.targetUsage} onChange={e => setForm({ ...form, targetUsage: e.target.value })}
                    min="0" step="0.5"
                    className="flex-1 bg-zinc-800 text-white text-center text-3xl font-bold rounded-2xl py-3 outline-none focus:ring-2 focus:ring-green-500 border border-zinc-700" />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setForm(f => ({ ...f, targetUsage: String(Number(f.targetUsage) + 0.5) }))}
                    className="w-12 h-12 rounded-2xl bg-zinc-800 text-white text-2xl font-bold flex items-center justify-center border border-zinc-700">+</motion.button>
                </div>
                <p className="text-zinc-500 text-xs text-center mt-3">
                  {form.targetUsage === "0" ? "🎯 Going for complete cessation" : `🎯 Reducing from ${form.currentUsage} → ${form.targetUsage} ${form.unit}/day`}
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => goBack(0)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 text-white font-semibold py-3.5 rounded-2xl">← Back</motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setError(""); goNext(2); }}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-2xl">Continue →</motion.button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-2xl p-5">
                <label className="text-zinc-400 text-xs block mb-2">What's motivating you? (optional)</label>
                <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Better sleep, save money, mental clarity..."
                  rows={3} className="w-full bg-zinc-800 text-white rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 border border-zinc-700 resize-none" />
                <div className="flex flex-wrap gap-2 mt-3">
                  {["Better sleep 😴", "Save money 💰", "Mental clarity 🧠", "More energy ⚡", "Be present 🧘"].map(tag => (
                    <motion.button key={tag} whileTap={{ scale: 0.93 }} onClick={() => setForm(f => ({ ...f, reason: f.reason ? f.reason + ", " + tag : tag }))}
                      className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-green-600 hover:text-green-400 transition">{tag}</motion.button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => goBack(1)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 text-white font-semibold py-3.5 rounded-2xl">← Back</motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleGenerate} disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Building...
                    </span>
                  ) : "Generate My Plan ✨"}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─── Progress View ────────────────────────────────────────────────────────────
const ProgressView = ({ plan, onRefresh }) => {
  const token = localStorage.getItem("token");
  const [activeTab,     setActiveTab]     = useState("home");
  const [showLogModal,  setShowLogModal]  = useState(false);

  const currentWeekData = plan.weeklyTargets?.[plan.currentWeek - 1];
  const totalDays       = plan.goal.durationWeeks * 7;
  const daysSinceStart  = Math.floor((new Date() - new Date(plan.createdAt || Date.now())) / 86400000);
  const overallProgress = Math.min(Math.round((daysSinceStart / totalDays) * 100), 100);

  const thisWeekLogs = plan.progressLogs?.filter(log => {
    if (!currentWeekData) return false;
    const d = new Date(log.date);
    return d >= new Date(currentWeekData.startDate) && d <= new Date(currentWeekData.endDate);
  }) || [];

  const avgThisWeek   = thisWeekLogs.length ? (thisWeekLogs.reduce((s, l) => s + l.actualUsage, 0) / thisWeekLogs.length).toFixed(1) : null;
  const totalLogged   = plan.progressLogs?.reduce((s, l) => s + l.actualUsage, 0) || 0;
  const saved         = Math.max(0, plan.goal.currentUsage * daysSinceStart - totalLogged);
  const moneySaved    = (saved * 10).toFixed(0);
  const streak        = plan.streak ?? 0;

  const earnedBadges = BADGE_DEFS.map(b => ({
    ...b,
    earned: b.threshold(plan.progressLogs?.length || 0, streak, plan.currentWeek, Number(moneySaved), overallProgress)
  }));

  const handlePause = async () => {
    const newStatus = plan.status === "active" ? "paused" : "active";
    try {
      await axios.put(`${API}/api/tplan/${plan._id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const TABS = [
    { id: "home",     label: "Home",     emoji: "🏠" },
    { id: "schedule", label: "Schedule", emoji: "📅" },
    { id: "feed",     label: "Discover", emoji: "✨" },
    { id: "badges",   label: "Badges",   emoji: "🏆" },
  ];

  return (
    <div className="space-y-5">
      {showLogModal && <QuickLogModal plan={plan} onClose={() => setShowLogModal(false)} onLogged={onRefresh} />}

      {/* Tab bar */}
      <div className="flex bg-zinc-900/80 border border-zinc-700/50 rounded-2xl p-1 gap-1">
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="relative flex-1 flex flex-col items-center py-2 rounded-xl text-xs font-semibold transition z-10"
              style={{ color: active ? "white" : "#71717a" }}
            >
              {active && (
                <motion.div layoutId="tplan-tab"
                  className="absolute inset-0 bg-green-600 rounded-xl"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 text-base">{t.emoji}</span>
              <span className="relative z-10 mt-0.5">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ── HOME ── */}
        {activeTab === "home" && (
          <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {plan.status === "paused" && (
              <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 text-sm rounded-2xl p-3 text-center">
                ⏸ Plan paused — resume anytime
              </div>
            )}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">Week {plan.currentWeek} of {plan.goal.durationWeeks}</p>
                  <h2 className="text-white font-bold text-xl mt-0.5">Your Progress</h2>
                </div>
                <StreakBadge streak={streak} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <RingProgress percent={overallProgress} size={140} label="complete" sublabel="overall" />
                <div className="flex-1 space-y-3">
                  <div className="bg-zinc-800/80 rounded-2xl p-3">
                    <p className="text-zinc-500 text-xs">Today's target</p>
                    <p className="text-white font-bold text-xl">
                      ≤ <span className="text-green-400">{currentWeekData?.targetPerDay ?? "—"}</span>
                      <span className="text-zinc-400 text-sm font-normal ml-1">{plan.goal.unit}</span>
                    </p>
                  </div>
                  <div className="bg-zinc-800/80 rounded-2xl p-3">
                    <p className="text-zinc-500 text-xs">This week avg</p>
                    <p className="text-white font-bold text-xl">
                      {avgThisWeek ?? "—"}
                      <span className="text-zinc-400 text-sm font-normal ml-1">{plan.goal.unit}</span>
                    </p>
                  </div>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowLogModal(true)}
                className={`w-full mt-5 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 ${
                  plan.todayLogged
                    ? "bg-zinc-700 hover:bg-zinc-600 border border-zinc-600"
                    : "bg-gradient-to-r from-green-600 to-emerald-500 shadow-lg shadow-green-900/30"
                }`}
              >
                <span className="text-lg">{plan.todayLogged ? "✏️" : "📝"}</span>
                {plan.todayLogged ? `Update Today's Log (${plan.todayUsage} ${plan.goal.unit})` : "Log Today's Usage"}
              </motion.button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard icon="📅" label="Days logged"  value={plan.progressLogs?.length ?? 0}        color="text-blue-400"   delay={0.05} />
              <StatCard icon="💰" label="Est. saved"   value={`£${moneySaved}`}                      color="text-yellow-400" delay={0.1} />
              <StatCard icon="📉" label="Reduction"    value={`${Math.round(((plan.goal.currentUsage - (Number(avgThisWeek) || plan.goal.currentUsage)) / plan.goal.currentUsage) * 100)}%`} color="text-green-400" delay={0.15} />
            </div>

            {plan.moodBreakdown && Object.values(plan.moodBreakdown).some(v => v > 0) && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-zinc-900/80 border border-zinc-700/50 rounded-2xl p-4">
                <p className="text-white font-semibold text-sm mb-3">😊 Mood While Logging</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: "great",   emoji: "😄", label: "Great",   color: "text-green-400" },
                    { key: "okay",    emoji: "😐", label: "Okay",    color: "text-blue-400" },
                    { key: "tough",   emoji: "😔", label: "Tough",   color: "text-yellow-400" },
                    { key: "craving", emoji: "😤", label: "Craving", color: "text-red-400" },
                  ].map(m => (
                    <div key={m.key} className="flex flex-col items-center bg-zinc-800/60 rounded-xl py-3 gap-1">
                      <span className="text-xl">{m.emoji}</span>
                      <span className={`font-bold text-lg ${m.color}`}>{plan.moodBreakdown[m.key] ?? 0}</span>
                      <span className="text-zinc-500 text-xs">{m.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {plan.aiRefinement && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-700/40 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <span className="text-green-300 text-xs font-semibold uppercase tracking-wide">AI Therapist</span>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">{plan.aiRefinement}</p>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-zinc-900/80 border border-zinc-700/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-semibold text-sm">Reduction Progress</p>
                <span className="text-green-400 text-xs font-semibold">{overallProgress}% of plan done</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="bg-gradient-to-r from-green-600 to-emerald-400 h-2.5 rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Day 1</span><span>Day {totalDays}</span>
              </div>
            </motion.div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={handlePause}
              className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold py-3 rounded-2xl transition">
              {plan.status === "active" ? "⏸ Pause Plan" : "▶ Resume Plan"}
            </motion.button>
          </motion.div>
        )}

        {/* ── SCHEDULE ── */}
        {activeTab === "schedule" && (
          <motion.div key="schedule" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold px-1">Full {plan.goal.durationWeeks}-Week Schedule</p>
            {plan.weeklyTargets.map((wk, i) => {
              const isCurrent = wk.week === plan.currentWeek;
              const isPast    = wk.week < plan.currentWeek;
              return (
                <motion.div key={wk.week} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 rounded-2xl p-4 border transition ${
                    isCurrent ? "bg-green-900/30 border-green-700/50" : isPast ? "bg-zinc-900/40 border-zinc-800 opacity-60" : "bg-zinc-900/60 border-zinc-800"
                  }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                    isCurrent ? "bg-green-600 text-white" : isPast ? "bg-zinc-700 text-zinc-400" : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {isPast ? "✓" : `W${wk.week}`}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold">
                      Max <span className={isCurrent ? "text-green-400" : "text-zinc-300"}>{wk.targetPerDay}</span> {plan.goal.unit}/day
                      {isCurrent && <span className="ml-2 text-green-400 text-xs bg-green-900/40 px-2 py-0.5 rounded-full">← You are here</span>}
                    </p>
                    {wk.notes && <p className="text-zinc-500 text-xs mt-0.5">💡 {wk.notes}</p>}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── DISCOVER ── */}
        {activeTab === "feed" && (
          <motion.div key="feed" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold px-1">Personalised for you today</p>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {feedItems.map((item, i) => <FeedCard key={i} item={item} delay={i * 0.06} />)}
            </div>
            <ReminderToggles />
          </motion.div>
        )}

        {/* ── BADGES ── */}
        {activeTab === "badges" && (
          <motion.div key="badges" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-zinc-400 text-xs uppercase tracking-wide font-semibold">Your Achievements</p>
              <span className="text-green-400 text-xs font-semibold">{earnedBadges.filter(b => b.earned).length}/{earnedBadges.length} earned</span>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-2 px-1">Earned 🎉</p>
              <div className="grid grid-cols-2 gap-3">
                {earnedBadges.filter(b => b.earned).map((b, i) => (
                  <motion.div key={b.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                    className="bg-gradient-to-br from-green-900/40 to-zinc-900/60 border border-green-700/40 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-3xl">{b.emoji}</span>
                    <div><p className="text-white text-sm font-semibold">{b.label}</p><p className="text-zinc-500 text-xs">{b.desc}</p></div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-2 px-1">Locked 🔒</p>
              <div className="grid grid-cols-2 gap-3">
                {earnedBadges.filter(b => !b.earned).map(b => (
                  <div key={b.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3 opacity-40">
                    <span className="text-3xl grayscale">{b.emoji}</span>
                    <div><p className="text-zinc-400 text-sm font-semibold">{b.label}</p><p className="text-zinc-600 text-xs">{b.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
const TplanPage = () => {
  const token = localStorage.getItem("token");
  const [plan,       setPlan]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState("");

  const fetchPlan = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const { data } = await axios.get(`${API}/api/tplan/active`, { headers: { Authorization: `Bearer ${token}` } });
      setPlan(data.plan || null);
    } catch (err) {
      if (err.response?.status === 404) setPlan(null);
      else setFetchError("Failed to load your plan. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlan(); }, []);

  return (
    <div className="min-h-screen bg-zinc-950 -mx-4 -mt-6 sm:-mx-6 sm:-mt-6 lg:-mx-8">
      <div className="max-w-lg mx-auto px-4 py-6 pb-28">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">🌿 <span>Tapering Plan</span></h1>
            <p className="text-zinc-500 text-xs mt-0.5">Reduce at your own pace, guided by AI</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={fetchPlan}
            className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition">
            ↻
          </motion.button>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-500 text-sm">Loading your plan...</p>
            </motion.div>
          ) : fetchError ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm rounded-2xl p-4 text-center">{fetchError}</motion.div>
          ) : plan ? (
            <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProgressView plan={plan} onRefresh={fetchPlan} />
            </motion.div>
          ) : (
            <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SetupView onPlanCreated={(newPlan) => setPlan(newPlan)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default TplanPage;