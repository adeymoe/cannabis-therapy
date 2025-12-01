// src/components/Chatpage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "./Header";
import { jwtDecode } from "jwt-decode";

import SessionPickerModal from "./SessionPickerModal";
import NewSessionModal from "./NewSessionModal";
import DailyCheckinPopup from "./DailyCheckinPopup";

const Chatpage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionTypes, setSessionTypes] = useState([]);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [anonymousNewSession, setAnonymousNewSession] = useState(false);
  const [showDailyCheckin, setShowDailyCheckin] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  const isAnonymous = !!activeSession?.metadata?.anonymous;

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper: get user ID from token
  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.userId || decoded.id || decoded.sub;
    } catch (e) {
      console.error("Failed to decode token", e);
      return null;
    }
  };

  // Helper: get today's localStorage key (user-specific)
  const getTodayKey = () => {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const userId = getUserId();
    return `weedtherapy_checkin_prompt_${userId}_${today}`;
  };

  // Setup Web Speech API
  const handleToggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (e) {
        console.error("Failed to start recognition", e);
      }
    }
  };

  const fetchSessions = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/auth");

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/session/my`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        const sessionList = res.data.sessions || [];
        setSessions(sessionList);

        const activeSessionFromList = sessionList.find((s) => !s.ended);
        if (activeSessionFromList) {
          await loadSession(activeSessionFromList._id);
        } else if (sessionList.length === 0) {
          await createNewSession("general");
        }
      }
    } catch (err) {
      console.error("Error loading sessions", err);
      await createNewSession("general");
    }
  };

  const loadSession = async (sessionId) => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/auth");

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/session/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        const session = res.data.session;
        setActiveSession(session);

        const displayMessages = session.history.filter(
          (m) => m.role !== "system"
        );
        setMessages(
          displayMessages.length > 0
            ? displayMessages
            : [
                {
                  role: "assistant",
                  content: getWelcomeMessage(session.sessionType),
                },
              ]
        );
      }
    } catch (err) {
      console.error("Error loading session", err);
    }
  };

  const getWelcomeMessage = (sessionType) => {
    const welcomes = {
      general:
        "Hi, I'm your AI therapy companion 🌱. I'm here to support you with anything related to cannabis use, mental health, or general wellbeing. What's on your mind today?",
      crisis:
        "🚨 Crisis Mode activated. I'm here to help you through this craving emergency. Take a deep breath. You've got this. What's happening right now?",
      craving_management:
        "🔥 Let's look at your cravings more calmly and long-term. When do they usually show up, and what patterns have you noticed?",
      stress_relief:
        "🧘 Let's work through this stress together. Tell me what's weighing on you right now?",
      mood_regulation:
        "💙 I'm here to help you understand and work with your emotions. How are you feeling right now?",
      grounding:
        "🌿 Let's bring you back to the present moment. I'll guide you through some grounding. Ready?",
      relapse_reflection:
        "🔄 First, I want you to know: you're not a failure. Slips happen. Let's learn from this together. What happened?",
      guided_reflection:
        "🪞 Let's slow down and process your day together. I'll guide you through some reflective questions. Ready?",
      habit_builder:
        "📅 Let's design tiny, realistic habits that stick. What area of your life would you like to improve?",
      daily_journal:
        "📓 Welcome to your daily journal space. How are you feeling today? What's on your mind?",
    };
    return welcomes[sessionType] || welcomes.general;
  };

  const createNewSession = async (sessionTypeCode) => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/auth");

    console.log("🚀 Creating session with code:", sessionTypeCode);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/session/start`,
        {
          sessionType: sessionTypeCode,
          anonymous: anonymousNewSession,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Session created:", res.data.session);

      if (res.data.success) {
        const newSession = res.data.session;
        setSessions((prev) => [newSession, ...prev]);
        setShowNewSessionModal(false);
        setAnonymousNewSession(false);
        await loadSession(newSession._id);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
      alert("Failed to create session. Please try again.");
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (
      !window.confirm("Delete this session permanently? This cannot be undone.")
    ) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return navigate("/auth");

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/session/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSessions((prev) => prev.filter((s) => s._id !== sessionId));

      if (activeSession && activeSession._id === sessionId) {
        const remaining = sessions.filter((s) => s._id !== sessionId);
        if (remaining.length > 0) {
          loadSession(remaining[0]._id);
        } else {
          setActiveSession(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
      alert("Failed to delete session. Please try again.");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !activeSession) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/session/continue`,
        { sessionId: activeSession._id, message: userMessage.content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const botMessage = { role: "assistant", content: res.data.reply };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        alert(res.data.message || "Failed to get response.");
      }
    } catch (error) {
      console.error("Send message error:", error);
      const fallback = {
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const pauseSession = async () => {
    if (!activeSession) return;
    if (
      !window.confirm(
        "Pause this session? You can resume it anytime from your sessions list."
      )
    )
      return;

    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/session/end`,
        { sessionId: activeSession._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert("Session paused. Starting a new General Therapy session.");
        fetchSessions();
      }
    } catch (err) {
      console.error("Error pausing session:", err);
    }
  };

  // Daily check-in handlers
  const handleGoToCheckin = () => {
    const todayKey = getTodayKey();
    localStorage.setItem(todayKey, "done");
    setShowDailyCheckin(false);
    navigate("/checkin");
  };

  const handleSkipCheckin = () => {
    setShowDailyCheckin(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (e) => {
      console.error("SpeechRecognition error", e);
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  // 🔁 Fetch session types, filter & reorder
  useEffect(() => {
    const fetchTypes = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/auth");

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/session/types`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.data.success) {
          console.log("📋 Session types loaded:", res.data.types);

          const allTypes = res.data.types || [];

          // Only keep canonical/working codes (avoids duplicate broken types)
          const allowedCodes = new Set([
            "general",
            "crisis",
            "craving_management",
            "stress_relief",
            "mood_regulation",
            "grounding",
            "relapse_reflection",
            "guided_reflection",
            "habit_builder",
            "daily_journal",
          ]);

          const filtered = allTypes.filter((t) => allowedCodes.has(t.code));

          // Unique by code
          const uniqueByCode = Array.from(
            new Map(filtered.map((t) => [t.code, t])).values()
          );

          // Last three in this order
          const specialOrder = [
            "guided_reflection",
            "daily_journal",
            "habit_builder",
          ];

          const regularTypes = uniqueByCode.filter(
            (t) => !specialOrder.includes(t.code)
          );

          const specialTypes = specialOrder
            .map((code) => uniqueByCode.find((t) => t.code === code))
            .filter(Boolean);

          setSessionTypes([...regularTypes, ...specialTypes]);
        }
      } catch (err) {
        console.error("Error loading session types", err);
      }
    };
    fetchTypes();
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/auth");
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if user already handled today's check-in
  useEffect(() => {
    const checkTodayCheckin = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const userId = getUserId();
      if (!userId) {
        console.log("   ⚠️ Could not get user ID from token");
        return;
      }

      const todayKey = getTodayKey();
      const alreadyHandled = localStorage.getItem(todayKey);

      console.log("🔍 Checking daily check-in...");
      console.log("   User ID:", userId);
      console.log("   Today's key:", todayKey);
      console.log("   LocalStorage value:", alreadyHandled);

      if (alreadyHandled === "done") {
        console.log("   ✅ Already handled today (localStorage)");
        setShowDailyCheckin(false);
        return;
      }

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/checkin/today`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("   Backend response:", res.data);

        if (res.data?.success) {
          if (res.data.checkin) {
            console.log("   ✅ Check-in already completed today");
            localStorage.setItem(todayKey, "done");
            setShowDailyCheckin(false);
          } else {
            console.log("   🌤️ No check-in yet - showing popup");
            setShowDailyCheckin(true);
          }
        } else {
          console.log("   ❌ Backend returned success: false");
          setShowDailyCheckin(false);
        }
      } catch (err) {
        console.error("Error checking daily check-in status", err);
        console.log("   ⚠️ Error - showing popup to be safe");
        setShowDailyCheckin(true);
      }
    };

    checkTodayCheckin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Header title="WEED THERAPY" />

      <div className="max-w-4xl mx-auto">
        {/* Session Controls - sticky bar */}
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border border-[#e1ddd3] rounded-2xl shadow-sm px-4 py-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowSessionPicker(true)}
              className="px-3 py-1.5 bg-white border border-[#e1ddd3] rounded-lg text-xs sm:text-sm text-[#2E3A33] hover:border-[#6CB28E] hover:bg-[#EAF5EF] transition flex items-center gap-1.5"
            >
              <span>📋</span>
              <span>Sessions</span>
            </button>
            <button
              onClick={() => setShowNewSessionModal(true)}
              className="px-3 py-1.5 bg-[#6CB28E] text-white rounded-lg text-xs sm:text-sm hover:bg-[#5FA47F] transition flex items-center gap-1.5 shadow-sm"
            >
              <span>➕</span>
              <span>New</span>
            </button>
          </div>

          {activeSession && (
            <div className="flex items-center gap-2 text-xs text-[#7A6C58]">
              <span className="font-medium truncate max-w-[120px] sm:max-w-none">
                {activeSession.title}
              </span>
              {isAnonymous && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300 text-[10px] uppercase tracking-wide font-semibold whitespace-nowrap">
                  🔒 Anon
                </span>
              )}
              <button
                onClick={pauseSession}
                className="text-[#E76F51] hover:underline whitespace-nowrap"
              >
                Pause
              </button>
            </div>
          )}
        </div>

        {/* Main chat container */}
        <div
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#e1ddd3] shadow-lg overflow-hidden flex flex-col"
          style={{ height: "calc(100vh - 240px)", minHeight: "500px" }}
        >
          {/* Anonymous banner */}
          {isAnonymous && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-[#e1ddd3]">
              <div className="flex items-center justify-center gap-2">
                <span className="text-base">🔒</span>
                <p className="text-xs text-gray-700 font-medium text-center">
                  <span className="font-semibold">Anonymous Mode</span> — avoid
                  sharing identifying details
                </p>
              </div>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-[#fdfcfa] to-[#f5f3ee]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-[#6CB28E] text-white rounded-br-md"
                      : "bg-white border border-[#e1ddd3] text-[#2E3A33] rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-[#e1ddd3] text-sm text-[#7A6C58] flex items-center gap-2">
                  <span>Therapist is typing</span>
                  <div className="flex gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-[#6CB28E] rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-[#6CB28E] rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-1.5 h-1.5 bg-[#6CB28E] rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 sm:p-5 border-t border-[#e1ddd3] bg-white">
            <div className="flex items-end gap-2 mb-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-[#e1ddd3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6CB28E] focus:border-transparent resize-none text-sm bg-[#fdfcfa]"
                rows="2"
              />

              {voiceSupported && (
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`p-3 rounded-xl border transition flex-shrink-0 ${
                    listening
                      ? "border-[#E76F51] bg-red-50 text-[#E76F51]"
                      : "border-[#e1ddd3] bg-white text-[#6CB28E] hover:bg-[#EAF5EF]"
                  }`}
                  title={listening ? "Stop listening" : "Start voice input"}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a2 2 0 00-2 2v5a2 2 0 004 0V4a2 2 0 00-2-2z" />
                    <path
                      fillRule="evenodd"
                      d="M5 8a1 1 0 112 0 3 3 0 006 0 1 1 0 112 0 5 5 0 01-4 4.9V15h2a1 1 0 110 2H7a1 1 0 110-2h2v-2.1A5 5 0 015 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>

            <button
              onClick={sendMessage}
              disabled={loading || !activeSession || !input.trim()}
              className={`w-full text-white py-3 rounded-xl font-medium transition text-sm shadow-sm ${
                loading || !activeSession || !input.trim()
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-[#6CB28E] hover:bg-[#5FA47F] active:scale-[0.98]"
              }`}
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      </div>

      {/* Modals / Popups */}
      <SessionPickerModal
        isOpen={showSessionPicker}
        onClose={() => setShowSessionPicker(false)}
        sessions={sessions}
        activeSessionId={activeSession?._id}
        onSelectSession={(id) => {
          loadSession(id);
          setShowSessionPicker(false);
        }}
        onDeleteSession={handleDeleteSession}
      />

      <NewSessionModal
        isOpen={showNewSessionModal}
        onClose={() => {
          setShowNewSessionModal(false);
          setAnonymousNewSession(false);
        }}
        anonymousNewSession={anonymousNewSession}
        onToggleAnonymous={() =>
          setAnonymousNewSession((prev) => !prev)
        }
        sessionTypes={sessionTypes}
        onSelectSessionType={(code) => createNewSession(code)}
      />

      <DailyCheckinPopup
        isOpen={showDailyCheckin}
        onGoToCheckin={handleGoToCheckin}
        onSkip={handleSkipCheckin}
      />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Chatpage;