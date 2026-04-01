import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import weedLogo from '../assets/weedLogo.jpg';

const NAV_ITEMS = [
  { path: '/',               label: 'Therapy Chat',        emoji: '💬', color: 'green' },
  { path: '/dashboard',      label: 'Recovery Dashboard',  emoji: '📊', color: 'green' },
  { path: '/checkin',        label: 'Daily Check-In',      emoji: '✅', color: 'green' },
  { path: '/cud-screening',  label: 'CUD Screening',       emoji: '🧠', color: 'purple' },
  { path: '/dose',           label: 'Know Your Dose',      emoji: '💨', color: 'green' },
  { path: '/tplan',          label: 'T-Plan',              emoji: '📉', color: 'blue' },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Strain recommender state
  const [loadingRec, setLoadingRec]       = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  // Drug interaction state
  const [showInteraction, setShowInteraction]     = useState(false);
  const [interactionInput, setInteractionInput]   = useState('');
  const [interactionMeds, setInteractionMeds]     = useState([]);
  const [interactionResult, setInteractionResult] = useState(null);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [interactionError, setInteractionError]   = useState('');

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
    window.location.reload();
  };

  const go = (path) => {
    navigate(path);
    onClose?.();
  };

  const isActive = (path) => location.pathname === path;

  // ── Strain recommender ──────────────────────────────────────────
  const fetchRecommendations = async () => {
    setLoadingRec(true);
    setRecommendations(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/strain/recommend`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setRecommendations(res.data.recommendations || []);
      else alert('Failed to fetch recommendations');
    } catch (err) {
      console.error(err);
      alert('Error fetching recommendations');
    } finally {
      setLoadingRec(false);
    }
  };

  // ── Drug interaction helpers ────────────────────────────────────
  const severityConfig = {
    safe:    { color: 'text-green-600',  bg: 'bg-green-50 border-green-200',   badge: 'bg-green-100 text-green-700',   icon: '✅', label: 'No Known Interactions' },
    caution: { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', icon: '⚠️', label: 'Use With Caution' },
    danger:  { color: 'text-red-600',    bg: 'bg-red-50 border-red-200',       badge: 'bg-red-100 text-red-700',       icon: '🚨', label: 'Serious Interaction — Consult Doctor' },
  };

  const addMed = () => {
    const t = interactionInput.trim();
    if (!t || interactionMeds.includes(t)) return;
    setInteractionMeds([...interactionMeds, t]);
    setInteractionInput('');
  };

  const removeMed = (med) => setInteractionMeds(interactionMeds.filter((m) => m !== med));

  const checkInteractions = async () => {
    if (!interactionMeds.length) { setInteractionError('Add at least one medication.'); return; }
    setInteractionLoading(true);
    setInteractionError('');
    setInteractionResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/interaction/check`,
        { medications: interactionMeds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) setInteractionResult(res.data.data);
      else throw new Error(res.data.message || 'Check failed');
    } catch (err) {
      setInteractionError(err.response?.data?.message || err.message || 'Failed');
    } finally {
      setInteractionLoading(false);
    }
  };

  const closeInteraction = () => {
    setShowInteraction(false);
    setInteractionMeds([]);
    setInteractionInput('');
    setInteractionResult(null);
    setInteractionError('');
  };

  // ── Sidebar content ─────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/20">
          <img src={weedLogo} alt="logo" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Cannabis Therapy</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-green-200 font-medium">Beta</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-white/40 px-3 mb-2">Main</p>
        {NAV_ITEMS.map(({ path, label, emoji, color }) => {
          const active = isActive(path);
          const activeClass =
            color === 'purple' ? 'bg-purple-500/30 text-purple-200 font-semibold'
            : color === 'blue'   ? 'bg-blue-500/30 text-blue-200 font-semibold'
            :                      'bg-[#4a9e6b]/40 text-green-100 font-semibold';
          const hoverClass =
            color === 'purple' ? 'hover:bg-purple-500/20 hover:text-purple-200'
            : color === 'blue'   ? 'hover:bg-blue-500/20 hover:text-blue-200'
            :                      'hover:bg-white/10 hover:text-white';
          return (
            <button
              key={path}
              onClick={() => go(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left
                ${active ? activeClass : `text-white/70 ${hoverClass}`}`}
            >
              <span className="text-base w-5 text-center flex-shrink-0">{emoji}</span>
              <span className="truncate">{label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />}
            </button>
          );
        })}

        {/* Tools section */}
        <p className="text-[10px] uppercase tracking-widest text-white/40 px-3 mt-5 mb-2">Tools</p>

        <button
          onClick={fetchRecommendations}
          disabled={loadingRec}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all duration-150 text-left disabled:opacity-50"
        >
          <span className="text-base w-5 text-center flex-shrink-0">🌿</span>
          <span>{loadingRec ? 'Loading...' : 'Recommend Strain'}</span>
        </button>

        <button
          onClick={() => setShowInteraction(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all duration-150 text-left"
        >
          <span className="text-base w-5 text-center flex-shrink-0">💊</span>
          <span>Drug Interactions</span>
        </button>
      </nav>

      {/* Bottom: profile + logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-150 text-left"
        >
          <span className="text-base w-5 text-center flex-shrink-0">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-[#1a3a2a] h-screen sticky top-0 overflow-hidden shadow-xl">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[1500] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Drawer */}
          <aside className="relative w-64 bg-[#1a3a2a] h-full shadow-2xl flex flex-col z-10 animate-slide-in-left">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-xl"
            >
              ✕
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Strain Recommendation Modal ── */}
      {recommendations && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="bg-gradient-to-r from-[#1a3a2a] to-[#4a7c5e] px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-white font-bold text-lg">🌿 Strain Recommendations</h2>
                <p className="text-green-200 text-xs mt-0.5">Personalised based on your latest check-in</p>
              </div>
              <button onClick={() => setRecommendations(null)} className="text-white/70 hover:text-white text-2xl font-light transition">×</button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              {recommendations.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-4xl mb-2">🌱</p>
                  <p className="text-sm">No recommendations available right now.</p>
                  <p className="text-xs mt-1">Try completing a daily check-in first.</p>
                </div>
              ) : (
                recommendations.map((rec, i) => (
                  <div key={i} className="rounded-2xl border border-[#e1ddd3] bg-gradient-to-br from-[#f9f7f3] to-[#EAF5EF] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-4 p-4">
                      {rec.imageUrl ? (
                        <img src={rec.imageUrl} alt={rec.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 shadow" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-[#d4edda] flex items-center justify-center flex-shrink-0 text-3xl">🌿</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-[#2E3A33] text-base leading-tight">{rec.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6CB28E] text-white font-semibold whitespace-nowrap flex-shrink-0">#{i + 1} Pick</span>
                        </div>
                        {rec.type && (
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[#2F7E57] border border-[#c3e6cb] font-medium uppercase tracking-wide">{rec.type}</span>
                        )}
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
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[#e1ddd3] px-5 py-3 bg-[#f9f7f3] flex-shrink-0">
              <p className="text-[10px] text-[#7A6C58] text-center">🔒 For harm reduction purposes only. Always consult a healthcare professional.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Drug Interaction Modal ── */}
      {showInteraction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative shadow-xl overflow-y-auto max-h-[85vh]">
            <button onClick={closeInteraction} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 font-bold text-xl">×</button>
            <h2 className="text-xl font-bold text-gray-800 mb-1">💊 Drug Interaction Checker</h2>
            <p className="text-xs text-gray-400 mb-4">Check if your medications interact with cannabis (THC/CBD)</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-700">
              ℹ️ <strong>Medical Disclaimer:</strong> This tool provides general information only. Always consult your doctor or pharmacist.
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={interactionInput}
                onChange={(e) => setInteractionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMed()}
                placeholder="e.g. Warfarin, Sertraline..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                autoFocus
              />
              <button onClick={addMed} className="bg-green-500 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition">Add</button>
            </div>
            {interactionMeds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {interactionMeds.map((med) => (
                  <span key={med} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                    {med}
                    <button onClick={() => removeMed(med)} className="text-gray-400 hover:text-red-500 font-bold ml-1">×</button>
                  </span>
                ))}
              </div>
            )}
            {interactionError && <p className="text-red-500 text-xs mb-2">{interactionError}</p>}
            <button
              onClick={checkInteractions}
              disabled={interactionLoading}
              className="w-full bg-green-500 text-white py-2.5 rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50 mb-4 text-sm"
            >
              {interactionLoading ? 'Checking...' : 'Check Interactions'}
            </button>
            {interactionResult && severityConfig[interactionResult.severity] && (() => {
              const config = severityConfig[interactionResult.severity];
              return (
                <div className={`rounded-xl border p-4 ${config.bg}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                      <p className={`font-bold text-sm ${config.color}`}>{config.label}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{interactionResult.summary}</p>
                    </div>
                  </div>
                  {interactionResult.interactions?.map((item, i) => (
                    <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 text-sm">{item.medication}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityConfig[item.severity]?.badge || 'bg-gray-100 text-gray-600'}`}>
                          {item.severity?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{item.effect}</p>
                      <p className="text-xs text-green-700 mt-1 font-medium">💡 {item.recommendation}</p>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 mt-2 italic">{interactionResult.disclaimer}</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;