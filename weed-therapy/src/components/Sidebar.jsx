// src/components/Sidebar.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import weedLogo from "../assets/weedLogo.jpg";
import axios from "axios";

const NAV_ITEMS = [
  { path: "/",              label: "Therapy Chat",       emoji: "💬", color: "green" },
  { path: "/dashboard",     label: "Recovery Dashboard", emoji: "📊", color: "green" },
  { path: "/checkin",       label: "Daily Check-In",     emoji: "✅", color: "green" },
  { path: "/cud-screening", label: "CUD Screening",      emoji: "🧠", color: "purple" },
  { path: "/dose",          label: "Know Your Dose",     emoji: "💨", color: "green" },
  { path: "/tplan",         label: "T-Plan",             emoji: "📉", color: "blue" },
];

const severityConfig = {
  safe:    { color: "text-[#2F7E57]",  bg: "bg-[#EAF5EF] border-[#c6e3d1]",  badge: "bg-[#6CB28E] text-white",  icon: "✅", label: "No Known Interactions" },
  caution: { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200",  badge: "bg-yellow-400 text-white", icon: "⚠️", label: "Use With Caution" },
  danger:  { color: "text-red-600",    bg: "bg-red-50 border-red-200",        badge: "bg-red-500 text-white",    icon: "🚨", label: "Serious Interaction — Consult Doctor" },
};

// Reusable modal overlay — flex centering so it's always fully visible
const ModalOverlay = ({ onClose, maxWidth = "sm:max-w-lg", children }) => (
  <div
    style={{ zIndex: 9999 }}
    className="fixed inset-0 flex items-end sm:items-center justify-center"
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    />
    <div className={`relative w-full ${maxWidth} sm:mx-4 flex flex-col`}>
      {children}
    </div>
  </div>
);

const Sidebar = ({ mobileOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loadingRec, setLoadingRec]                 = useState(false);
  const [recommendations, setRecommendations]       = useState(null);
  const [showInteraction, setShowInteraction]       = useState(false);
  const [interactionInput, setInteractionInput]     = useState("");
  const [interactionMeds, setInteractionMeds]       = useState([]);
  const [interactionResult, setInteractionResult]   = useState(null);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [interactionError, setInteractionError]     = useState("");

  const logout = () => { localStorage.removeItem("token"); window.location.href = "/auth"; };
  const go       = (path) => { navigate(path); onClose?.(); };
  const isActive = (path) => location.pathname === path;

  const fetchRecommendations = async () => {
    setLoadingRec(true);
    setRecommendations(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/strain/recommend`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setRecommendations(res.data.recommendations || []);
      else alert("Failed to fetch recommendations");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRec(false);
    }
  };

  const addMed = () => {
    const t = interactionInput.trim();
    if (!t || interactionMeds.includes(t)) return;
    setInteractionMeds([...interactionMeds, t]);
    setInteractionInput("");
  };
  const removeMed = (med) => setInteractionMeds(interactionMeds.filter((m) => m !== med));

  const checkInteractions = async () => {
    if (!interactionMeds.length) { setInteractionError("Add at least one medication."); return; }
    setInteractionLoading(true);
    setInteractionError("");
    setInteractionResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/interaction/check`,
        { medications: interactionMeds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setInteractionResult(res.data.data);
      else throw new Error(res.data.message || "Check failed");
    } catch (err) {
      setInteractionError(err.response?.data?.message || err.message || "Failed");
    } finally {
      setInteractionLoading(false);
    }
  };

  const closeInteraction = () => {
    setShowInteraction(false);
    setInteractionMeds([]);
    setInteractionInput("");
    setInteractionResult(null);
    setInteractionError("");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/20">
          <img src={weedLogo} alt="logo" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Cannabis Therapy</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-green-200 font-medium">Beta</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-white/40 px-3 mb-2">Main</p>
        {NAV_ITEMS.map(({ path, label, emoji, color }) => {
          const active = isActive(path);
          const activeClass = color === "purple" ? "bg-purple-500/30 text-purple-200 font-semibold" : color === "blue" ? "bg-blue-500/30 text-blue-200 font-semibold" : "bg-[#4a9e6b]/40 text-green-100 font-semibold";
          const hoverClass  = color === "purple" ? "hover:bg-purple-500/20 hover:text-purple-200" : color === "blue" ? "hover:bg-blue-500/20 hover:text-blue-200" : "hover:bg-white/10 hover:text-white";
          return (
            <motion.button key={path} whileTap={{ scale: 0.97 }} onClick={() => go(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left ${active ? activeClass : `text-white/70 ${hoverClass}`}`}>
              <span className="text-base w-5 text-center flex-shrink-0">{emoji}</span>
              <span className="truncate">{label}</span>
              {active && <motion.span layoutId="sidebar-active-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />}
            </motion.button>
          );
        })}

        <p className="text-[10px] uppercase tracking-widest text-white/40 px-3 mt-5 mb-2">Tools</p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={fetchRecommendations} disabled={loadingRec}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all duration-150 text-left disabled:opacity-50">
          <span className="text-base w-5 text-center flex-shrink-0">🌿</span>
          <span>{loadingRec ? "Loading..." : "Recommend Strain"}</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowInteraction(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all duration-150 text-left">
          <span className="text-base w-5 text-center flex-shrink-0">💊</span>
          <span>Drug Interactions</span>
        </motion.button>
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <motion.button whileTap={{ scale: 0.97 }} onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-150 text-left">
          <span className="text-base w-5 text-center flex-shrink-0">🚪</span>
          <span>Logout</span>
        </motion.button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-[#1a3a2a] h-screen sticky top-0 overflow-hidden shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile drawer — portal */}
      {createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <div className="lg:hidden fixed inset-0 flex" style={{ zIndex: 9990 }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
              <motion.aside
                initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="relative w-64 bg-[#1a3a2a] h-full shadow-2xl flex flex-col"
                style={{ zIndex: 9991 }}
              >
                <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
                  className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white transition">
                  ✕
                </motion.button>
                <SidebarContent />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Strain Recommendation Modal — portal with flex centering */}
      {createPortal(
        <AnimatePresence>
          {recommendations && (
            <ModalOverlay onClose={() => setRecommendations(null)} maxWidth="sm:max-w-xl">
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-[#2E3A33] to-[#4a7c5e] px-6 py-4 flex items-center justify-between flex-shrink-0">
                  <div>
                    <h2 className="text-white font-bold text-lg">🌿 Strain Recommendations</h2>
                    <p className="text-green-200 text-xs mt-0.5">Personalised based on your latest check-in</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setRecommendations(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition text-xl">×</motion.button>
                </div>
                <div className="flex justify-center pt-2 pb-1 sm:hidden">
                  <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>
                <div className="overflow-y-auto p-5 space-y-4 flex-1">
                  {recommendations.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <p className="text-4xl mb-2">🌱</p>
                      <p className="text-sm">No recommendations available right now.</p>
                      <p className="text-xs mt-1">Try completing a daily check-in first.</p>
                    </div>
                  ) : recommendations.map((rec, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="rounded-2xl border border-[#e1ddd3] bg-gradient-to-br from-[#f9f7f3] to-[#EAF5EF] overflow-hidden shadow-sm">
                      <div className="flex gap-4 p-4">
                        {rec.imageUrl ? <img src={rec.imageUrl} alt={rec.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 shadow" />
                          : <div className="w-20 h-20 rounded-xl bg-[#d4edda] flex items-center justify-center flex-shrink-0 text-3xl">🌿</div>}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-[#2E3A33] text-base leading-tight">{rec.name}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6CB28E] text-white font-semibold whitespace-nowrap flex-shrink-0">#{i + 1} Pick</span>
                          </div>
                          {rec.type && <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[#2F7E57] border border-[#c3e6cb] font-medium uppercase tracking-wide">{rec.type}</span>}
                        </div>
                      </div>
                      <div className="border-t border-[#e1ddd3] mx-4" />
                      <div className="px-4 py-3 space-y-2">
                        <div className="flex gap-2">
                          <span className="text-base flex-shrink-0">💡</span>
                          <div>
                            <p className="text-[11px] font-semibold text-[#2E3A33] uppercase tracking-wide mb-0.5">Why this?</p>
                            <p className="text-sm text-[#4a5568] leading-relaxed">{rec.rationale}</p>
                          </div>
                        </div>
                        {rec.cautions && (
                          <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            <span className="text-base flex-shrink-0">⚠️</span>
                            <div>
                              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Safety Note</p>
                              <p className="text-xs text-amber-800 leading-relaxed">{rec.cautions}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="border-t border-[#e1ddd3] px-5 py-3 bg-[#f9f7f3] flex-shrink-0">
                  <p className="text-[10px] text-[#7A6C58] text-center">🔒 For harm reduction purposes only. Always consult a healthcare professional.</p>
                </div>
              </motion.div>
            </ModalOverlay>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Drug Interaction Modal — portal with flex centering */}
      {createPortal(
        <AnimatePresence>
          {showInteraction && (
            <ModalOverlay onClose={closeInteraction} maxWidth="sm:max-w-lg">
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-[#e1ddd3] flex items-center justify-between flex-shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-[#2E3A33]">💊 Drug Interaction Checker</h2>
                    <p className="text-xs text-[#9a8e80] mt-0.5">Check cannabis interactions with your medications</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={closeInteraction}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5f3ee] text-[#7A6C58] hover:bg-[#e8e4dd] transition text-lg">×</motion.button>
                </div>

                <div className="overflow-y-auto p-5 space-y-4 flex-1">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-700">
                    ℹ️ <strong>Medical Disclaimer:</strong> General information only. Always consult your doctor or pharmacist.
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={interactionInput} onChange={(e) => setInteractionInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addMed()}
                      placeholder="e.g. Warfarin, Sertraline..." autoFocus
                      className="flex-1 border border-[#e1ddd3] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E] bg-[#fdfcfa]" />
                    <motion.button whileTap={{ scale: 0.93 }} onClick={addMed}
                      className="bg-[#6CB28E] text-white px-4 py-3 rounded-2xl text-sm font-semibold hover:bg-[#5a9a7a] transition flex-shrink-0">Add</motion.button>
                  </div>

                  <AnimatePresence>
                    {interactionMeds.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
                        {interactionMeds.map((med) => (
                          <motion.span key={med} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#EAF5EF] border border-[#c6e3d1] text-[#2E3A33] px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 font-medium">
                            💊 {med}
                            <button onClick={() => removeMed(med)} className="text-[#9a8e80] hover:text-red-500 font-bold">×</button>
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {interactionError && <p className="text-red-500 text-xs">{interactionError}</p>}

                  <motion.button whileTap={{ scale: 0.97 }} onClick={checkInteractions} disabled={interactionLoading}
                    className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition ${interactionLoading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#6CB28E] to-[#5a9e7a] text-white"}`}>
                    {interactionLoading ? "Checking..." : "Check Interactions"}
                  </motion.button>

                  <AnimatePresence>
                    {interactionResult && severityConfig[interactionResult.severity] && (() => {
                      const cfg = severityConfig[interactionResult.severity];
                      return (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          className={`rounded-2xl border-2 p-4 ${cfg.bg}`}>
                          <div className="flex items-start gap-3 mb-3">
                            <span className="text-2xl">{cfg.icon}</span>
                            <div>
                              <p className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</p>
                              <p className="text-[#4B3F2F] text-xs mt-0.5">{interactionResult.summary}</p>
                            </div>
                          </div>
                          {interactionResult.interactions?.map((item, i) => (
                            <div key={i} className="bg-white rounded-2xl p-3 border border-[#e1ddd3] mb-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-[#2E3A33] text-sm">{item.medication}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${severityConfig[item.severity]?.badge || "bg-gray-100 text-gray-600"}`}>
                                  {item.severity?.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-[#4B3F2F]">{item.effect}</p>
                              <p className="text-xs text-[#2F7E57] mt-1 font-medium">💡 {item.recommendation}</p>
                            </div>
                          ))}
                          <p className="text-[10px] text-[#9a8e80] mt-2 italic">{interactionResult.disclaimer}</p>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>

                <div className="p-4 border-t border-[#e1ddd3] flex-shrink-0 pb-[max(env(safe-area-inset-bottom),16px)]">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={closeInteraction}
                    className="w-full bg-[#f5f3ee] text-[#7A6C58] py-3 rounded-2xl font-semibold text-sm hover:bg-[#ede9e1] transition">
                    Close
                  </motion.button>
                </div>
              </motion.div>
            </ModalOverlay>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default Sidebar;