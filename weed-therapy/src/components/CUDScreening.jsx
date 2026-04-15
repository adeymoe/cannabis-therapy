// src/components/CUDScreening.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const QUESTIONS = [
  { key: "usedMoreThanIntended",           text: "Have you often used cannabis in larger amounts or for longer than you intended?" },
  { key: "triedToCutDown",                 text: "Have you tried to cut down or stop using cannabis but found it difficult?" },
  { key: "spentLotOfTime",                 text: "Have you spent a lot of time obtaining, using, or recovering from cannabis?" },
  { key: "cravings",                       text: "Have you experienced strong cravings or urges to use cannabis?" },
  { key: "failedObligations",              text: "Has cannabis use caused you to fail to fulfil obligations at work, school, or home?" },
  { key: "continuedDespiteSocialProblems", text: "Have you continued using cannabis despite it causing social or relationship problems?" },
  { key: "givenUpActivities",              text: "Have you given up or reduced important activities because of cannabis use?" },
  { key: "usedInHazardousSituations",      text: "Have you used cannabis in situations where it was physically hazardous?" },
  { key: "continuedDespiteHealthProblems", text: "Have you continued using cannabis despite knowing it was harming your physical or mental health?" },
  { key: "tolerance",                      text: "Have you needed more cannabis to get the same effect (tolerance)?" },
  { key: "withdrawal",                     text: "Have you experienced withdrawal symptoms (irritability, anxiety, sleep issues) when stopping or reducing use?" },
];

const SEVERITY_CONFIG = {
  "No CUD": {
    border: "border-[#6CB28E]", bg: "bg-[#EAF5EF]",
    text: "text-[#2F7E57]", icon: "✅",
    label: "No Cannabis Use Disorder Detected",
    description: "Your responses suggest your cannabis use is not currently causing clinically significant impairment.",
  },
  Mild: {
    border: "border-yellow-400", bg: "bg-yellow-50",
    text: "text-yellow-700", icon: "⚠️",
    label: "Mild Cannabis Use Disorder",
    description: "You endorsed 2–3 criteria. Some patterns worth monitoring and addressing early.",
  },
  Moderate: {
    border: "border-orange-400", bg: "bg-orange-50",
    text: "text-orange-700", icon: "🔶",
    label: "Moderate Cannabis Use Disorder",
    description: "You endorsed 4–5 criteria. Professional support alongside this app can be very helpful.",
  },
  Severe: {
    border: "border-red-400", bg: "bg-red-50",
    text: "text-red-700", icon: "🚨",
    label: "Severe Cannabis Use Disorder",
    description: "You endorsed 6 or more criteria. Please consider reaching out to a healthcare professional.",
  },
};

const NEXT_STEPS = {
  "No CUD": [
    { icon: "✅", text: "Keep up your mindful approach to cannabis use" },
    { icon: "📅", text: "Consider a monthly check-in to track any changes" },
    { icon: "💬", text: "Use the AI chat for general wellness support" },
  ],
  Mild: [
    { icon: "📓", text: "Start a daily check-in to track your patterns" },
    { icon: "💬", text: "Try a Stress Coping or Mood Regulation session" },
    { icon: "🎯", text: "Set a small reduction goal this week" },
  ],
  Moderate: [
    { icon: "🧘", text: "Try a Grounding/Mindfulness session today" },
    { icon: "📊", text: "Review your Recovery Dashboard for trigger patterns" },
    { icon: "👨‍⚕️", text: "Consider speaking with a GP or counsellor" },
  ],
  Severe: [
    { icon: "🚨", text: "Please reach out to a healthcare professional soon" },
    { icon: "📞", text: "UK: Frank Helpline — 0300 123 6600" },
    { icon: "💬", text: "Use Craving Emergency Help for immediate support" },
    { icon: "👨‍⚕️", text: "Ask your GP about structured cannabis treatment programmes" },
  ],
};

// Slide direction based on navigation
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const CUDScreening = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState({});
  const [userNote, setUserNote] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const progress = Math.round((currentQ / QUESTIONS.length) * 100);
  const yesCount = Object.values(answers).filter(Boolean).length;

  const handleAnswer = (value) => {
    const key = QUESTIONS[currentQ].key;
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    setDirection(1);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      setStep("note");
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setDirection(-1);
      setCurrentQ((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/auth");
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/cud/submit`,
        { answers, userNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.screening) {
        setResult(res.data.screening);
        setStep("result");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setStep("intro"); setCurrentQ(0); setAnswers({});
    setUserNote(""); setResult(null); setError(""); setDirection(1);
  };

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-[#e1ddd3] shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-[#2E3A33] to-[#4a7c5e] px-6 py-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="text-5xl mb-3"
            >🧠</motion.div>
            <h1 className="text-xl font-bold text-white mb-1">CUD Self-Screening</h1>
            <p className="text-green-200 text-sm">Based on DSM-5 diagnostic criteria</p>
          </div>

          <div className="p-6 space-y-4">
            {/* About */}
            <div className="bg-[#EAF5EF] border border-[#c6e3d1] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#2F7E57] mb-2 uppercase tracking-wide">About this screening</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: "📋", text: "11 DSM-5 questions" },
                  { icon: "⏱️", text: "2–3 minutes" },
                  { icon: "🔒", text: "Private & saved" },
                  { icon: "🤖", text: "AI feedback included" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-[#2E3A33]">
                    <span>{icon}</span><span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ Disclaimer</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                This is a self-screening tool, <strong>not a clinical diagnosis</strong>. Results are for personal awareness only. Consult a qualified healthcare professional for a formal assessment.
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep("quiz")}
              className="w-full bg-gradient-to-r from-[#6CB28E] to-[#5a9e7a] text-white font-semibold py-4 rounded-2xl text-sm shadow-sm"
            >
              Start Screening →
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  if (step === "quiz") {
    const q = QUESTIONS[currentQ];
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl border border-[#e1ddd3] shadow-lg overflow-hidden">
          {/* Progress header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex justify-between items-center text-xs text-[#7A6C58] mb-2">
              <span className="font-medium">Question {currentQ + 1} of {QUESTIONS.length}</span>
              <span className="flex items-center gap-1">
                <span className="text-[#6CB28E] font-semibold">{yesCount}</span> yes so far
              </span>
            </div>
            <div className="w-full bg-[#f0ebe1] rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-[#6CB28E] to-[#4a9e6b] h-2 rounded-full"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {/* Question dots */}
            <div className="flex gap-1 mt-2 justify-center">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === currentQ ? "w-4 bg-[#6CB28E]" :
                    i < currentQ ? "w-1.5 bg-[#6CB28E]/40" :
                    "w-1.5 bg-[#e1ddd3]"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question with slide animation */}
          <div className="px-5 py-4 min-h-[160px] overflow-hidden relative">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={currentQ}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                <p className="text-[10px] text-[#6CB28E] font-bold uppercase tracking-widest mb-2">
                  DSM-5 Criterion {currentQ + 1}
                </p>
                <p className="text-base font-medium text-[#2E3A33] leading-relaxed">{q.text}</p>
                <p className="text-xs text-[#9a8e80] mt-2">Thinking about the <strong>past 12 months</strong></p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Answer buttons */}
          <div className="px-5 pb-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(1)}
                className="bg-gradient-to-br from-[#6CB28E] to-[#5a9e7a] text-white font-semibold py-4 rounded-2xl text-base shadow-sm"
              >
                ✅ Yes
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(0)}
                className="bg-white border-2 border-[#e1ddd3] hover:border-[#6CB28E] hover:bg-[#EAF5EF] text-[#2E3A33] font-semibold py-4 rounded-2xl text-base transition"
              >
                ❌ No
              </motion.button>
            </div>

            {currentQ > 0 && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleBack}
                className="w-full py-2.5 text-sm text-[#7A6C58] hover:text-[#2E3A33] transition flex items-center justify-center gap-1"
              >
                ← Previous question
              </motion.button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Note ───────────────────────────────────────────────────────────────────
  if (step === "note") {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-[#e1ddd3] shadow-lg p-6"
        >
          <div className="text-center mb-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-4xl mb-2"
            >📝</motion.div>
            <h2 className="text-lg font-semibold text-[#2E3A33]">Almost there!</h2>
            <p className="text-sm text-[#7A6C58] mt-1">
              Add an optional note about how you're feeling right now — this helps the AI personalise your feedback.
            </p>
          </div>

          {/* Score preview */}
          <div className="bg-[#EAF5EF] border border-[#c6e3d1] rounded-2xl p-3 mb-4 text-center">
            <p className="text-xs text-[#7A6C58]">You answered <strong className="text-[#2F7E57]">Yes</strong> to</p>
            <p className="text-2xl font-bold text-[#2F7E57]">{yesCount}<span className="text-sm font-normal text-[#7A6C58]"> / {QUESTIONS.length}</span></p>
            <p className="text-xs text-[#7A6C58]">criteria</p>
          </div>

          <textarea
            value={userNote}
            onChange={(e) => setUserNote(e.target.value)}
            placeholder="e.g. I've been stressed lately and using more than usual..."
            rows={4}
            className="w-full px-4 py-3 border border-[#e1ddd3] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6CB28E] resize-none text-sm bg-[#fdfcfa] mb-4"
          />

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center mb-3"
            >{error}</motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full text-white py-4 rounded-2xl font-semibold text-sm shadow-sm mb-2 ${
              loading ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-[#6CB28E] to-[#5a9e7a]"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analysing results...
              </span>
            ) : "Get My Results →"}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setDirection(-1); setStep("quiz"); }}
            className="w-full text-[#7A6C58] hover:text-[#2E3A33] text-sm py-2 transition"
          >
            ← Review my answers
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (step === "result" && result) {
    const config = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG["No CUD"];
    const steps = NEXT_STEPS[result.severity] || NEXT_STEPS["No CUD"];

    return (
      <div className="max-w-lg mx-auto space-y-4 pb-10">

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={`rounded-3xl p-6 border-2 ${config.border} ${config.bg} text-center`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="text-5xl mb-3"
          >{config.icon}</motion.div>
          <h2 className={`text-lg font-bold ${config.text} mb-1`}>{config.label}</h2>
          <p className="text-sm text-[#7A6C58] mb-3">{config.description}</p>
          <div className="inline-flex items-center gap-2 bg-white/70 rounded-full px-4 py-1.5">
            <span className="text-sm text-[#7A6C58]">Score:</span>
            <span className={`text-lg font-bold ${config.text}`}>{result.totalScore}</span>
            <span className="text-sm text-[#7A6C58]">/ 11 criteria</span>
          </div>
        </motion.div>

        {/* Score bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-[#e1ddd3] shadow-sm p-5"
        >
          <p className="text-xs font-semibold text-[#7A6C58] uppercase tracking-wide mb-3">Severity Scale</p>
          <div className="flex items-center gap-2 text-xs text-[#7A6C58] mb-1">
            <span>0</span>
            <div className="flex-1 bg-[#f0ebe1] rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(result.totalScore / 11) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-3 rounded-full bg-gradient-to-r from-[#6CB28E] via-yellow-400 to-red-400"
              />
            </div>
            <span>11</span>
          </div>
          <div className="flex justify-between text-[10px] text-[#9a8e80] px-6">
            <span>No CUD</span><span>Mild</span><span>Moderate</span><span>Severe</span>
          </div>
        </motion.div>

        {/* AI Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#e1ddd3] shadow-sm p-5"
        >
          <p className="text-xs font-semibold text-[#6CB28E] uppercase tracking-wide mb-3">🤖 Personalised Feedback</p>
          <p className="text-sm text-[#2E3A33] leading-relaxed whitespace-pre-line">{result.aiFeedback}</p>
        </motion.div>

        {/* Next steps */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-[#e1ddd3] shadow-sm p-5"
        >
          <p className="text-xs font-semibold text-[#7A6C58] uppercase tracking-wide mb-3">📌 Suggested Next Steps</p>
          <div className="space-y-2">
            {steps.map(({ icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
                className="flex items-start gap-3 text-sm text-[#2E3A33]"
              >
                <span className="flex-shrink-0 mt-0.5">{icon}</span>
                <span>{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleRestart}
            className="bg-white border border-[#e1ddd3] hover:border-[#6CB28E] hover:bg-[#EAF5EF] text-[#2E3A33] font-medium py-3 rounded-2xl text-sm transition"
          >
            🔄 Retake
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-[#6CB28E] to-[#5a9e7a] text-white font-medium py-3 rounded-2xl text-sm shadow-sm"
          >
            📊 Dashboard
          </motion.button>
        </motion.div>

        <p className="text-center text-xs text-[#b0a898] pb-2">
          This screening is for personal awareness only and does not constitute a clinical diagnosis.
        </p>
      </div>
    );
  }

  return null;
};

export default CUDScreening;