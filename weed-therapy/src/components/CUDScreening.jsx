// src/components/CUDScreening.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
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
    borderColor: "border-green-300",
    bg: "bg-green-50",
    textColor: "text-green-700",
    icon: "✅",
    label: "No Cannabis Use Disorder Detected",
  },
  Mild: {
    borderColor: "border-yellow-300",
    bg: "bg-yellow-50",
    textColor: "text-yellow-700",
    icon: "⚠️",
    label: "Mild Cannabis Use Disorder",
  },
  Moderate: {
    borderColor: "border-orange-300",
    bg: "bg-orange-50",
    textColor: "text-orange-700",
    icon: "🔶",
    label: "Moderate Cannabis Use Disorder",
  },
  Severe: {
    borderColor: "border-red-300",
    bg: "bg-red-50",
    textColor: "text-red-700",
    icon: "🚨",
    label: "Severe Cannabis Use Disorder",
  },
};

const CUDScreening = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("intro"); // intro | quiz | note | result
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [userNote, setUserNote] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const progress = Math.round((currentQ / QUESTIONS.length) * 100);

  const handleAnswer = (value) => {
    const key = QUESTIONS[currentQ].key;
    const updated = { ...answers, [key]: value };
    setAnswers(updated);

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      setStep("note");
    }
  };

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ((prev) => prev - 1);
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
      console.error("CUD submit error:", err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setStep("intro");
    setCurrentQ(0);
    setAnswers({});
    setUserNote("");
    setResult(null);
    setError("");
  };

  // ── Intro Screen ──────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <>
        <Header title="CUD Screening" />
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#e1ddd3] shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🧠</div>
              <h1 className="text-2xl font-semibold text-[#2E3A33] mb-2">
                CUD Self-Screening
              </h1>
              <p className="text-sm text-[#7A6C58]">
                Based on the DSM-5 diagnostic criteria for Cannabis Use Disorder
              </p>
            </div>

            <div className="bg-[#EAF5EF] border border-[#c5e0d0] rounded-xl p-4 mb-5 text-sm text-[#2E3A33]">
              <p className="font-semibold mb-2">📋 About this screening</p>
              <ul className="list-disc list-inside space-y-1 text-[#4a6b58]">
                <li>11 clinically validated questions</li>
                <li>Takes about 2–3 minutes</li>
                <li>Results are private and saved to your profile</li>
                <li>AI-powered personalised feedback included</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
              <p className="font-semibold mb-1">⚠️ Disclaimer</p>
              <p>
                This is a self-screening tool,{" "}
                <strong>not a clinical diagnosis</strong>. Results are for
                personal awareness only. Please consult a qualified healthcare
                professional for a formal assessment.
              </p>
            </div>

            <button
              onClick={() => setStep("quiz")}
              className="w-full bg-[#6CB28E] hover:bg-[#5FA47F] text-white font-medium py-3 rounded-xl transition text-sm shadow-sm active:scale-[0.98]"
            >
              Start Screening →
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Quiz Screen ───────────────────────────────────────────────────────────
  if (step === "quiz") {
    const q = QUESTIONS[currentQ];
    return (
      <>
        <Header title="CUD Screening" />
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#e1ddd3] shadow-lg p-8">

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-[#7A6C58] mb-2">
                <span>Question {currentQ + 1} of {QUESTIONS.length}</span>
                <span>{progress}% complete</span>
              </div>
              <div className="w-full bg-[#f0ebe1] rounded-full h-2">
                <div
                  className="bg-[#6CB28E] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <p className="text-xs text-[#6CB28E] font-semibold uppercase tracking-wider mb-3">
                DSM-5 Criterion {currentQ + 1}
              </p>
              <p className="text-lg text-[#2E3A33] leading-relaxed">{q.text}</p>
              <p className="text-xs text-[#7A6C58] mt-2">
                Thinking about the <strong>past 12 months</strong>
              </p>
            </div>

            {/* Answer Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handleAnswer(1)}
                className="bg-[#6CB28E] hover:bg-[#5FA47F] text-white font-medium py-4 rounded-xl text-base transition shadow-sm active:scale-[0.98]"
              >
                ✅ Yes
              </button>
              <button
                onClick={() => handleAnswer(0)}
                className="bg-white border border-[#e1ddd3] hover:border-[#6CB28E] hover:bg-[#EAF5EF] text-[#2E3A33] font-medium py-4 rounded-xl text-base transition"
              >
                ❌ No
              </button>
            </div>

            {/* Back */}
            {currentQ > 0 && (
              <button
                onClick={handleBack}
                className="w-full text-[#7A6C58] hover:text-[#2E3A33] text-sm py-2 transition"
              >
                ← Back to previous question
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Note Screen ───────────────────────────────────────────────────────────
  if (step === "note") {
    return (
      <>
        <Header title="CUD Screening" />
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#e1ddd3] shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📝</div>
              <h2 className="text-xl font-semibold text-[#2E3A33]">Almost done!</h2>
              <p className="text-sm text-[#7A6C58] mt-1">
                Add an optional note about how you're feeling right now
              </p>
            </div>

            <textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="e.g. I've been stressed lately and using more than usual..."
              rows={4}
              className="w-full px-4 py-3 border border-[#e1ddd3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6CB28E] focus:border-transparent resize-none text-sm bg-[#fdfcfa] text-[#2E3A33] placeholder-[#b0a898] mb-6"
            />

            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full text-white py-3 rounded-xl font-medium transition text-sm shadow-sm ${
                loading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#6CB28E] hover:bg-[#5FA47F] active:scale-[0.98]"
              }`}
            >
              {loading ? "Analysing your results..." : "Get My Results →"}
            </button>

            <button
              onClick={() => setStep("quiz")}
              className="w-full text-[#7A6C58] hover:text-[#2E3A33] text-sm py-2 mt-2 transition"
            >
              ← Review my answers
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Result Screen ─────────────────────────────────────────────────────────
  if (step === "result" && result) {
    const config = SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG["No CUD"];

    return (
      <>
        <Header title="CUD Screening" />
        <div className="max-w-2xl mx-auto px-4 space-y-4 pb-10">

          {/* Score Card */}
          <div
            className={`rounded-2xl p-6 border ${config.borderColor} ${config.bg} text-center`}
          >
            <div className="text-5xl mb-3">{config.icon}</div>
            <h2 className={`text-xl font-semibold ${config.textColor} mb-1`}>
              {config.label}
            </h2>
            <p className="text-sm text-[#7A6C58]">
              You endorsed <strong>{result.totalScore}</strong> out of 11 DSM-5 criteria
            </p>
          </div>

          {/* Score Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#e1ddd3] shadow-sm p-5">
            <p className="text-xs text-[#7A6C58] uppercase tracking-wider mb-3 font-medium">
              Severity Scale
            </p>
            <div className="flex items-center gap-2 text-xs text-[#7A6C58] mb-2">
              <span>0</span>
              <div className="flex-1 bg-[#f0ebe1] rounded-full h-3 relative">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-[#6CB28E] via-yellow-400 to-red-400 transition-all duration-500"
                  style={{ width: `${(result.totalScore / 11) * 100}%` }}
                />
              </div>
              <span>11</span>
            </div>
            <div className="flex justify-between text-[10px] text-[#7A6C58] mt-1">
              <span>No CUD</span>
              <span>Mild</span>
              <span>Moderate</span>
              <span>Severe</span>
            </div>
          </div>

          {/* AI Feedback */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#e1ddd3] shadow-sm p-6">
            <p className="text-xs text-[#6CB28E] uppercase tracking-wider font-semibold mb-3">
              🤖 Personalised Feedback
            </p>
            <p className="text-sm text-[#2E3A33] leading-relaxed whitespace-pre-line">
              {result.aiFeedback}
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#e1ddd3] shadow-sm p-5">
            <p className="text-xs text-[#7A6C58] uppercase tracking-wider font-semibold mb-3">
              📌 Suggested Next Steps
            </p>
            <ul className="space-y-2 text-sm text-[#2E3A33]">
              {result.severity === "No CUD" && (
                <>
                  <li>✅ Keep up your mindful approach to cannabis use</li>
                  <li>📅 Consider a monthly check-in to track any changes</li>
                  <li>💬 Use the AI chat for general wellness support</li>
                </>
              )}
              {result.severity === "Mild" && (
                <>
                  <li>📓 Start a daily check-in to track your patterns</li>
                  <li>💬 Try a "Stress Coping" or "Mood Regulation" session</li>
                  <li>🎯 Set a small reduction goal this week</li>
                </>
              )}
              {result.severity === "Moderate" && (
                <>
                  <li>🧘 Try a "Grounding/Mindfulness" session today</li>
                  <li>📊 Review your Recovery Dashboard for trigger patterns</li>
                  <li>👨‍⚕️ Consider speaking with a GP or counsellor</li>
                </>
              )}
              {result.severity === "Severe" && (
                <>
                  <li>🚨 Please reach out to a healthcare professional soon</li>
                  <li>📞 UK: Frank Helpline — 0300 123 6600</li>
                  <li>💬 Use "Craving Emergency Help" session for immediate support</li>
                  <li>👨‍⚕️ Ask your GP about structured cannabis treatment programmes</li>
                </>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleRestart}
              className="bg-white border border-[#e1ddd3] hover:border-[#6CB28E] hover:bg-[#EAF5EF] text-[#2E3A33] font-medium py-3 rounded-xl text-sm transition"
            >
              🔄 Retake Screening
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-[#6CB28E] hover:bg-[#5FA47F] text-white font-medium py-3 rounded-xl text-sm transition shadow-sm active:scale-[0.98]"
            >
              📊 Go to Dashboard
            </button>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-[#b0a898] pb-2">
            This screening is for personal awareness only and does not constitute a clinical diagnosis.
          </p>
        </div>
      </>
    );
  }

  return null;
};


export default CUDScreening;