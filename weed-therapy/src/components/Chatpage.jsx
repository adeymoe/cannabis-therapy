// src/components/Chatpage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
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
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  const isAnonymous = !!activeSession?.metadata?.anonymous;

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getUserId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.userId || decoded.id || decoded.sub;
    } catch (e) {
      return null;
    }
  };

  const getTodayKey = () => {
    const today = new Date().toISOString().slice(0, 10);
    const userId = getUserId();
    return `weedtherapy_checkin_prompt_${userId}_${today}`;
  };

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
        { headers: { Authorization: `Bearer ${token}` } }
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const session = res.data.session;
        setActiveSession(session);
        const displayMessages = session.history.filter((m) => m.role !== "system");
        setMessages(
          displayMessages.length > 0
            ? displayMessages
            : [{ role: "assistant", content: getWelcomeMessage(session.sessionType) }]
        );
      }
    } catch (err) {
      console.error("Error loading session", err);
    }
  };

  const getWelcomeMessage = (sessionType) => {
    const welcomes = {
      general: "Hi, I'm your AI therapy companion 🌱. I'm here to support you with anything related to cannabis use, mental health, or general wellbeing. What's on your mind today?",
      crisis: "🚨 Crisis Mode activated. I'm here to help you through this craving emergency. Take a deep breath. You've got this. What's happening right now?",
      craving_management: "🔥 Let's look at your cravings more calmly and long-term. When do they usually show up, and what patterns have you noticed?",
      stress_relief: "🧘 Let's work through this stress together. Tell me what's weighing on you right now?",
      mood_regulation: "💙 I'm here to help you understand and work with your emotions. How are you feeling right now?",
      grounding: "🌿 Let's bring you back to the present moment. I'll guide you through some grounding. Ready?",
      relapse_reflection: "🔄 First, I want you to know: you're not a failure. Slips happen. Let's learn from this together. What happened?",
      guided_reflection: "🪞 Let's slow down and process your day together. I'll guide you through some reflective questions. Ready?",
      habit_builder: "📅 Let's design tiny, realistic habits that stick. What area of your life would you like to improve?",
      daily_journal: "📓 Welcome to your daily journal space. How are you feeling today? What's on your mind?",
    };
    return welcomes[sessionType] || welcomes.general;
  };

  const createNewSession = async (sessionTypeCode) => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/auth");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/session/start`,
        { sessionType: sessionTypeCode, anonymous: anonymousNewSession },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
    if (!window.confirm("Delete this session permanently? This cannot be undone.")) return;
    const token = localStorage.getItem("token");
    if (!token) return navigate("/auth");
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/session/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !activeSession) return;
    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/session/continue`,
        { sessionId: activeSession._id, message: userMessage.content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
      } else {
        alert(res.data.message || "Failed to get response.");
      }
    } catch (error) {
      console.error("Send message error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." },
      ]);
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

  // Auto-grow textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const pauseSession = async () => {
    if (!activeSession) return;
    if (!window.confirm("Pause this session? You can resume it anytime from your sessions list.")) return;
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

  const handleGoToCheckin = () => {
    localStorage.setItem(getTodayKey(), "done");
    setShowDailyCheckin(false);
    navigate("/checkin");
  };

  const handleSkipCheckin = () => setShowDailyCheckin(false);

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceSupported(false); return; }
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
    recognition.onend = () => setListening(false);
    recognition.onerror = (e) => { console.error("SpeechRecognition error", e); setListening(false); };
    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, []);

  useEffect(() => {
    const fetchTypes = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/auth");
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/session/types`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          const allTypes = res.data.types || [];
          const allowedCodes = new Set(["general","crisis","craving_management","stress_relief","mood_regulation","grounding","relapse_reflection","guided_reflection","habit_builder","daily_journal"]);
          const filtered = allTypes.filter((t) => allowedCodes.has(t.code));
          const uniqueByCode = Array.from(new Map(filtered.map((t) => [t.code, t])).values());
          const specialOrder = ["guided_reflection", "daily_journal", "habit_builder"];
          const regularTypes = uniqueByCode.filter((t) => !specialOrder.includes(t.code));
          const specialTypes = specialOrder.map((code) => uniqueByCode.find((t) => t.code === code)).filter(Boolean);
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

  useEffect(() => {
    const checkTodayCheckin = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const userId = getUserId();
      if (!userId) return;
      const todayKey = getTodayKey();
      if (localStorage.getItem(todayKey) === "done") { setShowDailyCheckin(false); return; }
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/checkin/today`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.success) {
          if (res.data.checkin) { localStorage.setItem(todayKey, "done"); setShowDailyCheckin(false); }
          else setShowDailyCheckin(true);
        } else { setShowDailyCheckin(false); }
      } catch (err) {
        setShowDailyCheckin(true);
      }
    };
    checkTodayCheckin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="max-w-4xl mx-auto h-full flex flex-col" style={{ height: "calc(100vh - 140px)" }}>

        {/* ── Session Controls Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 bg-white/90 backdrop-blur-md border border-[#e1ddd3] rounded-2xl shadow-sm px-4 py-3 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSessionPicker(true)}
              className="px-3 py-1.5 bg-white border border-[#e1ddd3] rounded-xl text-xs sm:text-sm text-[#2E3A33] hover:border-[#6CB28E] hover:bg-[#EAF5EF] transition flex items-center gap-1.5 font-medium"
            >
              <span>📋</span>
              <span>Sessions</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewSessionModal(true)}
              className="px-3 py-1.5 bg-[#6CB28E] text-white rounded-xl text-xs sm:text-sm hover:bg-[#5FA47F] transition flex items-center gap-1.5 shadow-sm font-medium"
            >
              <span>➕</span>
              <span>New Session</span>
            </motion.button>
          </div>

          {activeSession && (
            <div className="flex items-center gap-2 text-xs text-[#7A6C58]">
              <div className="w-2 h-2 rounded-full bg-[#6CB28E] animate-pulse flex-shrink-0" />
              <span className="font-medium truncate max-w-[140px] sm:max-w-none text-[#2E3A33]">
                {activeSession.title}
              </span>
              {isAnonymous && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 text-[10px] uppercase tracking-wide font-semibold whitespace-nowrap">
                  🔒 Anon
                </span>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={pauseSession}
                className="text-[#E76F51] hover:text-[#d4603f] font-medium whitespace-nowrap transition"
              >
                Pause
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* ── Main chat container ── */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#e1ddd3] shadow-lg overflow-hidden flex flex-col min-h-0">

          {/* Anonymous banner */}
          <AnimatePresence>
            {isAnonymous && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-[#e1ddd3] overflow-hidden"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base">🔒</span>
                  <p className="text-xs text-gray-700 font-medium text-center">
                    <span className="font-semibold">Anonymous Mode</span> — avoid sharing identifying details
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gradient-to-b from-[#fdfcfa] to-[#f5f3ee]">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* Avatar for assistant */}
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6CB28E] to-[#4a9e6b] flex items-center justify-center text-white text-xs flex-shrink-0 mr-2 mt-1 shadow-sm">
                      🌱
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] sm:max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#6CB28E] to-[#5a9e7a] text-white rounded-br-md"
                        : "bg-white border border-[#e1ddd3] text-[#2E3A33] rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex justify-start items-end gap-2"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6CB28E] to-[#4a9e6b] flex items-center justify-center text-white text-xs flex-shrink-0 shadow-sm">
                    🌱
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-[#e1ddd3] flex items-center gap-1.5 shadow-sm">
                    {[0, 150, 300].map((delay) => (
                      <motion.span
                        key={delay}
                        className="w-2 h-2 bg-[#6CB28E] rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: delay / 1000 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>

          {/* ── Input area ── */}
          <div className="flex-shrink-0 p-3 sm:p-4 border-t border-[#e1ddd3] bg-white/95 backdrop-blur-sm">
            <div className="flex items-end gap-2">
              {/* Auto-growing textarea */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 border border-[#e1ddd3] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6CB28E] focus:border-transparent resize-none text-sm bg-[#fdfcfa] transition leading-relaxed"
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                  rows="1"
                />
              </div>

              {/* Voice button */}
              {voiceSupported && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={handleToggleListening}
                  className={`p-3 rounded-2xl border transition flex-shrink-0 ${
                    listening
                      ? "border-[#E76F51] bg-red-50 text-[#E76F51] shadow-sm"
                      : "border-[#e1ddd3] bg-white text-[#6CB28E] hover:bg-[#EAF5EF]"
                  }`}
                >
                  {listening ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a2 2 0 00-2 2v5a2 2 0 004 0V4a2 2 0 00-2-2z" />
                        <path fillRule="evenodd" d="M5 8a1 1 0 112 0 3 3 0 006 0 1 1 0 112 0 5 5 0 01-4 4.9V15h2a1 1 0 110 2H7a1 1 0 110-2h2v-2.1A5 5 0 015 8z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a2 2 0 00-2 2v5a2 2 0 004 0V4a2 2 0 00-2-2z" />
                      <path fillRule="evenodd" d="M5 8a1 1 0 112 0 3 3 0 006 0 1 1 0 112 0 5 5 0 01-4 4.9V15h2a1 1 0 110 2H7a1 1 0 110-2h2v-2.1A5 5 0 015 8z" clipRule="evenodd" />
                    </svg>
                  )}
                </motion.button>
              )}

              {/* Send button */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={sendMessage}
                disabled={loading || !activeSession || !input.trim()}
                className={`p-3 rounded-2xl font-medium transition flex-shrink-0 shadow-sm ${
                  loading || !activeSession || !input.trim()
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#6CB28E] hover:bg-[#5FA47F] text-white"
                }`}
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
              </motion.button>
            </div>

            <p className="text-[10px] text-[#B0A89A] text-center mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SessionPickerModal
        isOpen={showSessionPicker}
        onClose={() => setShowSessionPicker(false)}
        sessions={sessions}
        activeSessionId={activeSession?._id}
        onSelectSession={(id) => { loadSession(id); setShowSessionPicker(false); }}
        onDeleteSession={handleDeleteSession}
      />
      <NewSessionModal
        isOpen={showNewSessionModal}
        onClose={() => { setShowNewSessionModal(false); setAnonymousNewSession(false); }}
        anonymousNewSession={anonymousNewSession}
        onToggleAnonymous={() => setAnonymousNewSession((prev) => !prev)}
        sessionTypes={sessionTypes}
        onSelectSessionType={(code) => createNewSession(code)}
      />
      <DailyCheckinPopup
        isOpen={showDailyCheckin}
        onGoToCheckin={handleGoToCheckin}
        onSkip={handleSkipCheckin}
      />
    </>
  );
};

export default Chatpage;