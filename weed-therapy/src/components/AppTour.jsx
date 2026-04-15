// src/components/AppTour.jsx
// Full-app onboarding tour — shown once after first login.
// Walks the user through every major feature with animated cards.
// No page navigation needed — purely informational with rich visuals.

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    id: "welcome",
    emoji: "🌿",
    category: null,
    title: "Welcome to Cannabis Therapy",
    description:
      "Your AI-powered Digital Therapeutic for managing, reducing, and understanding your cannabis use. Let's take a quick tour of everything available to you.",
    features: null,
    color: "#6CB28E",
    gradient: "from-[#1a3a2a] to-[#2d5a3d]",
    isWelcome: true,
  },
  {
    id: "therapy-chat",
    emoji: "💬",
    category: "Core Feature",
    title: "AI Therapy Sessions",
    description:
      "Your main space for support. Choose a session type and your AI therapist adapts its approach in real time — following a clinical framework of Acknowledge → Normalise → Suggest → Reassure.",
    features: [
      { icon: "🚨", label: "Craving Emergency", desc: "Instant support when cravings hit hard" },
      { icon: "🧘", label: "Stress Coping",     desc: "Work through what's weighing on you" },
      { icon: "🌿", label: "Grounding",         desc: "Come back to the present moment" },
      { icon: "🔄", label: "Relapse Reflection",desc: "Process slips without judgment" },
      { icon: "📓", label: "Daily Journal",     desc: "Reflect on your day with guidance" },
      { icon: "📅", label: "Habit Builder",     desc: "Design tiny habits that stick" },
    ],
    color: "#60a5fa",
    gradient: "from-[#1a2a3a] to-[#1e3d5a]",
  },
  {
    id: "checkin",
    emoji: "✅",
    category: "Daily Habit",
    title: "Daily Check-In",
    description:
      "30 seconds each day builds a powerful picture of your wellness over time. Log your mood, craving, stress, and energy — the AI reflects back what it notices.",
    features: [
      { icon: "😊", label: "Mood tracking",       desc: "1–10 tap-to-select scale" },
      { icon: "🔥", label: "Craving intensity",   desc: "Track when urges peak" },
      { icon: "⚡", label: "Stress & energy",     desc: "Spot your trigger patterns" },
      { icon: "🏃", label: "Coping activities",   desc: "Log what actually helped" },
    ],
    color: "#6CB28E",
    gradient: "from-[#1a2e1a] to-[#1e3d1e]",
  },
  {
    id: "dashboard",
    emoji: "📊",
    category: "Analytics",
    title: "Recovery Dashboard",
    description:
      "Your data transformed into insight. The app automatically detects trigger patterns using Pearson correlation — like noticing that high stress predicts an 80% craving spike for you specifically.",
    features: [
      { icon: "📈", label: "Mood trend charts",      desc: "30-day interactive visualisation" },
      { icon: "🔍", label: "Trigger detection",      desc: "AI finds stress→craving links" },
      { icon: "🧠", label: "Mood Stability Index",   desc: "Measures your emotional volatility" },
      { icon: "🏆", label: "Streak tracking",        desc: "Current and best check-in streaks" },
    ],
    color: "#a78bfa",
    gradient: "from-[#1e1a3a] to-[#2d1e5a]",
  },
  {
    id: "tplan",
    emoji: "📉",
    category: "Reduction Engine",
    title: "T-Plan: Tapering Engine",
    description:
      "Not ready to quit cold turkey? The T-Plan generates a personalised 4, 8, or 12-week reduction schedule based on your current habits and goals — and tracks your progress with streak badges.",
    features: [
      { icon: "🤖", label: "AI-generated schedule", desc: "Personalised week-by-week targets" },
      { icon: "⭕", label: "Progress ring",          desc: "Visual completion tracking" },
      { icon: "🏅", label: "Achievement badges",     desc: "Rewards for consistency" },
      { icon: "📝", label: "Daily usage log",        desc: "Quick mood + usage logging" },
    ],
    color: "#34d399",
    gradient: "from-[#0a2a1a] to-[#0e3d2a]",
  },
  {
    id: "harm-reduction",
    emoji: "🛡️",
    category: "Safety Tools",
    title: "Harm Reduction Suite",
    description:
      "Clinical-grade tools that keep you safe and informed. Every tool is built around evidence-based harm reduction principles.",
    features: [
      { icon: "🧠", label: "CUD Screening",         desc: "DSM-5 based self-assessment" },
      { icon: "💊", label: "Drug Interactions",     desc: "Check cannabis + your medications" },
      { icon: "💨", label: "Know Your Dose",        desc: "Log potency, get safety scores" },
      { icon: "🌿", label: "Strain Recommender",   desc: "Context-aware, non-cannabis alternatives prioritised" },
    ],
    color: "#fb923c",
    gradient: "from-[#2a1a0a] to-[#3d2a0e]",
  },
  {
    id: "privacy",
    emoji: "🔒",
    category: "Privacy & Access",
    title: "Built for Sensitive Use",
    description:
      "Cannabis is still stigmatised. Every feature is designed with that reality in mind — your data stays private, and you can go fully anonymous at any time.",
    features: [
      { icon: "👤", label: "Anonymous Mode",      desc: "One tap to hide your identity" },
      { icon: "🎤", label: "Voice Input",         desc: "Speak through cravings hands-free" },
      { icon: "🔐", label: "JWT + HTTP-only cookies", desc: "Secure authentication" },
      { icon: "📱", label: "Mobile-first design", desc: "Works like a native app" },
    ],
    color: "#fbbf24",
    gradient: "from-[#2a2a0a] to-[#3a3a0e]",
    isFinal: false,
  },
  {
    id: "ready",
    emoji: "🚀",
    category: null,
    title: "You're all set",
    description:
      "Start with the Therapy Chat — just tap 'New Session' and choose what you need right now. Everything else will make more sense as you explore.",
    features: null,
    color: "#6CB28E",
    gradient: "from-[#1a3a2a] to-[#2d5a3d]",
    isFinal: true,
    tips: [
      "Do your first Daily Check-In today to start building your baseline",
      "Try a Grounding session if you're feeling stressed right now",
      "Your Dashboard gets richer after 7+ check-ins",
    ],
  },
];

const slideVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
};

const AppTour = ({ onComplete }) => {
  const [step, setStep]         = useState(0);
  const [direction, setDirection] = useState(1);
  const [leaving, setLeaving]   = useState(false);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const goNext = () => {
    if (isLast) { finish(); return; }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    if (isFirst) return;
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const finish = () => {
    setLeaving(true);
    localStorage.setItem("ct_tour_done", "true");
    setTimeout(() => onComplete(), 350);
  };

  return createPortal(
    <AnimatePresence>
      {!leaving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ zIndex: 99999 }}
          className="fixed inset-0 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

          {/* Card container */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="relative w-full max-w-md flex flex-col overflow-hidden rounded-3xl shadow-2xl"
            style={{ maxHeight: "90vh" }}
          >
            {/* ── Gradient header ── */}
            <div
              className={`bg-gradient-to-br ${current.gradient} px-6 pt-8 pb-6 relative overflow-hidden flex-shrink-0`}
            >
              {/* Decorative bg circles */}
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-10"
                style={{ backgroundColor: current.color }} />
              <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full opacity-5"
                style={{ backgroundColor: current.color }} />

              {/* Top row: category badge + close */}
              <div className="flex items-center justify-between mb-5 relative">
                {current.category ? (
                  <motion.span
                    key={`cat-${step}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: `${current.color}25`,
                      color: current.color,
                      border: `1px solid ${current.color}40`,
                    }}
                  >
                    {current.category}
                  </motion.span>
                ) : <div />}

                <button
                  onClick={finish}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:text-white hover:bg-white/20 transition text-base"
                >×</button>
              </div>

              {/* Emoji + title */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`header-${step}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="text-4xl mb-3">{current.emoji}</div>
                  <h2 className="text-xl font-bold text-white leading-tight">{current.title}</h2>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── White body ── */}
            <div className="bg-white flex-1 overflow-y-auto">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`body-${step}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, delay: 0.04, ease: "easeOut" }}
                  className="px-6 pt-5 pb-4"
                >
                  <p className="text-sm text-[#4B3F2F] leading-relaxed mb-4">
                    {current.description}
                  </p>

                  {/* Feature grid */}
                  {current.features && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {current.features.map((f, i) => (
                        <motion.div
                          key={f.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.08 + i * 0.05 }}
                          className="flex items-start gap-2 p-3 rounded-2xl bg-[#f9f7f3] border border-[#ede9e0]"
                        >
                          <span className="text-lg flex-shrink-0 mt-0.5">{f.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#2E3A33] leading-tight">{f.label}</p>
                            <p className="text-[10px] text-[#9a8e80] mt-0.5 leading-tight">{f.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Tips for final screen */}
                  {current.tips && (
                    <div className="space-y-2">
                      {current.tips.map((tip, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.07 }}
                          className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#EAF5EF] border border-[#c6e3d1]"
                        >
                          <span className="text-[#6CB28E] text-sm flex-shrink-0 mt-0.5">✓</span>
                          <p className="text-xs text-[#2E3A33] leading-relaxed">{tip}</p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Footer ── */}
            <div className="bg-white border-t border-[#f0ebe1] px-6 py-4 flex-shrink-0">
              {/* Progress bar */}
              <div className="w-full bg-[#f0ebe1] rounded-full h-1 mb-4 overflow-hidden">
                <motion.div
                  className="h-1 rounded-full"
                  style={{ backgroundColor: current.color }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-1.5 mb-4">
                {STEPS.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                    animate={{
                      width:           i === step ? 20 : 6,
                      backgroundColor: i === step ? current.color : i < step ? `${current.color}60` : "#e1ddd3",
                    }}
                    transition={{ duration: 0.2 }}
                    className="h-1.5 rounded-full cursor-pointer"
                  />
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                {!isFirst && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={goPrev}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-[#7A6C58] bg-[#f5f3ee] hover:bg-[#ede9e1] transition"
                  >
                    ← Back
                  </motion.button>
                )}

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={goNext}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white shadow-sm transition"
                  style={{ backgroundColor: current.color }}
                >
                  {isLast ? "Start exploring 🚀" : isFirst ? "Take the tour →" : `Next →`}
                </motion.button>
              </div>

              {/* Skip */}
              {!isLast && (
                <button
                  onClick={finish}
                  className="w-full text-center text-xs text-[#b0a898] hover:text-[#7A6C58] transition mt-2 py-1"
                >
                  Skip tour
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AppTour;