// src/components/AppLayout.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CgProfile } from 'react-icons/cg';
import axios from 'axios';
import Sidebar from './Sidebar';

const PAGE_TITLES = {
  '/':              { title: 'Therapy Chat',        subtitle: 'AI-guided support for your cannabis journey' },
  '/dashboard':     { title: 'Recovery Dashboard',  subtitle: 'Your progress at a glance' },
  '/checkin':       { title: 'Daily Check-In',       subtitle: 'How are you feeling today?' },
  '/cud-screening': { title: 'CUD Screening',        subtitle: 'Cannabis Use Disorder self-assessment' },
  '/dose':          { title: 'Know Your Dose',       subtitle: 'Understand your consumption safely' },
  '/tplan':         { title: 'T-Plan',               subtitle: 'Your personalised tapering plan' },
  '/interaction':   { title: 'Drug Interactions',    subtitle: 'Check cannabis interactions with your medications' },
};

const NAV_ITEMS = [
  { path: '/',           icon: ChatIcon,      label: 'Chat' },
  { path: '/dashboard',  icon: DashboardIcon, label: 'Dashboard' },
  { path: '/checkin',    icon: CheckinIcon,   label: 'Check-In' },
  { path: '/tplan',      icon: TplanIcon,     label: 'T-Plan' },
  { path: '/dose',       icon: DoseIcon,      label: 'Dose' },
];

function ChatIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function DashboardIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function CheckinIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function TplanIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
function DoseIcon({ active }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

// ── Reusable modal overlay wrapper ───────────────────────────────────────────
// Uses flex centering so modal is always fully visible regardless of content height
const ModalOverlay = ({ onClose, children }) => (
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
    <div className="relative w-full sm:max-w-xl sm:mx-4 sm:max-h-[90vh] flex flex-col">
      {children}
    </div>
  </div>
);

// ── Strain Recommendation Modal ───────────────────────────────────────────────
const RecommendationModal = ({ recommendations, onClose }) => {
  if (!recommendations) return null;
  return createPortal(
    <AnimatePresence>
      <ModalOverlay onClose={onClose}>
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-[#2E3A33] to-[#4a7c5e] px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-white font-bold text-lg">🌿 Strain Recommendations</h2>
              <p className="text-green-200 text-xs mt-0.5">Personalised based on your latest check-in</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition text-xl"
            >×</motion.button>
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
            ) : (
              recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-[#e1ddd3] bg-gradient-to-br from-[#f9f7f3] to-[#EAF5EF] overflow-hidden shadow-sm"
                >
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
                </motion.div>
              ))
            )}
          </div>

          <div className="border-t border-[#e1ddd3] px-5 py-3 bg-[#f9f7f3] flex-shrink-0">
            <p className="text-[10px] text-[#7A6C58] text-center">🔒 For harm reduction purposes only. Always consult a healthcare professional.</p>
          </div>
        </motion.div>
      </ModalOverlay>
    </AnimatePresence>,
    document.body
  );
};

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};

const AppLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen]           = useState(false);
  const [showDropdown, setShowDropdown]       = useState(false);
  const [loadingRec, setLoadingRec]           = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const dropdownRef = useRef(null);
  const location    = useLocation();
  const navigate    = useNavigate();
  const page        = PAGE_TITLES[location.pathname] || { title: 'Cannabis Therapy', subtitle: '' };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth';
  };

  const fetchRecommendations = async () => {
    setLoadingRec(true);
    setRecommendations(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/strain/recommend`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setRecommendations(res.data.recommendations || []);
      } else {
        alert('Failed to fetch recommendations');
      }
    } catch (err) {
      console.error('Strain recommend error:', err);
      alert('Error fetching recommendations');
    } finally {
      setLoadingRec(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-[#f5f3ee] overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top bar ── */}
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-[#e1ddd3] px-4 sm:px-6 py-3 flex items-center gap-3 shadow-sm">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="lg:hidden p-2 rounded-xl text-[#2E3A33] hover:bg-[#EAF5EF] transition flex-shrink-0"
            onClick={() => setMobileOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="flex-1 min-w-0"
            >
              <h1 className="text-base sm:text-lg font-semibold text-[#2E3A33] truncate">{page.title}</h1>
              {page.subtitle && <p className="text-xs text-[#7A6C58] truncate hidden sm:block">{page.subtitle}</p>}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={fetchRecommendations}
              disabled={loadingRec}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6CB28E] text-white text-xs font-semibold hover:bg-[#5a9a7a] transition disabled:opacity-50 whitespace-nowrap"
            >
              {loadingRec ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : '🌿'}
              {loadingRec ? 'Loading...' : 'Recommend'}
            </motion.button>

            <motion.button whileTap={{ scale: 0.9 }} onClick={fetchRecommendations} disabled={loadingRec}
              className="sm:hidden p-2 rounded-xl border border-[#e1ddd3] bg-white text-[#2E3A33] hover:border-[#6CB28E] hover:bg-[#EAF5EF] transition disabled:opacity-50">
              🌿
            </motion.button>

            <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => navigate('/interaction')}
              className={`p-2 rounded-xl border transition ${isActive('/interaction') ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-[#e1ddd3] text-[#2E3A33] hover:border-blue-400 hover:bg-blue-50'}`}>
              💊
            </motion.button>

            <div className="relative" ref={dropdownRef}>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowDropdown(!showDropdown)}
                className="p-1.5 rounded-full text-[#2E3A33] hover:bg-[#f5f3ee] transition">
                <CgProfile className="text-2xl" />
              </motion.button>

              {showDropdown && createPortal(
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    style={{ position: 'fixed', top: '56px', right: '16px', zIndex: 9999 }}
                    className="w-52 bg-white border border-[#e1ddd3] rounded-xl shadow-xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[#f0ebe1]">
                      <p className="text-xs text-[#7A6C58]">Signed in to</p>
                      <p className="text-sm font-medium text-[#2E3A33]">Cannabis Therapy</p>
                    </div>
                    {[
                      { path: '/dashboard',     label: '📊 Recovery Dashboard' },
                      { path: '/',              label: '💬 Therapy Chat' },
                      { path: '/checkin',       label: '✅ Daily Check-In' },
                      { path: '/interaction',   label: '💊 Drug Interactions' },
                      { path: '/cud-screening', label: '🧠 CUD Screening' },
                      { path: '/dose',          label: '💨 Know Your Dose' },
                    ].map(({ path, label }) => (
                      <motion.button key={path} whileTap={{ scale: 0.98 }}
                        onClick={() => { setShowDropdown(false); navigate(path); }}
                        className={`w-full px-4 py-3 text-sm text-[#2E3A33] hover:bg-[#EAF5EF] text-left transition ${isActive(path) ? 'bg-[#EAF5EF] font-medium' : ''}`}>
                        {label}
                      </motion.button>
                    ))}
                    <div className="border-t border-[#f0ebe1]" />
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => { setShowDropdown(false); logout(); }}
                      className="w-full px-4 py-3 text-sm text-[#E76F51] hover:bg-red-50 text-left transition">
                      🚪 Logout
                    </motion.button>
                  </motion.div>
                </AnimatePresence>,
                document.body
              )}
            </div>
          </div>
        </header>

        {/* ── Scrollable content ── */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile bottom nav — z-index BELOW modals ── */}
      <nav
        style={{ zIndex: 500 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#e1ddd3] flex items-center justify-around px-1 pt-2 pb-[max(env(safe-area-inset-bottom),8px)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      >
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <motion.button key={path} onClick={() => navigate(path)} whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1 min-w-[56px]">
              {active && (
                <motion.div layoutId="nav-active-pill" className="absolute inset-0 bg-[#EAF5EF] rounded-2xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
              )}
              <motion.span animate={{ color: active ? '#2F7E57' : '#7A6C58', scale: active ? 1.1 : 1 }}
                transition={{ duration: 0.18 }} className="relative z-10">
                <Icon active={active} />
              </motion.span>
              <motion.span animate={{ color: active ? '#2F7E57' : '#7A6C58' }}
                className="relative z-10 text-[10px] font-medium leading-none">
                {label}
              </motion.span>
              {active && (
                <motion.span layoutId="nav-dot" className="relative z-10 w-1 h-1 rounded-full bg-[#4a9e6b] mt-0.5"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Recommendation Modal */}
      <RecommendationModal
        recommendations={recommendations}
        onClose={() => setRecommendations(null)}
      />
    </div>
  );
};

export default AppLayout;