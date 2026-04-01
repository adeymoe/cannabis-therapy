// src/components/AppLayout.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { CgProfile } from 'react-icons/cg';
import axios from 'axios';
import Sidebar from './Sidebar';

// ─── Page meta ───────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  '/':              { title: 'Therapy Chat',        subtitle: 'AI-guided support for your cannabis journey' },
  '/dashboard':     { title: 'Recovery Dashboard',  subtitle: 'Your progress at a glance' },
  '/checkin':       { title: 'Daily Check-In',      subtitle: 'How are you feeling today?' },
  '/cud-screening': { title: 'CUD Screening',       subtitle: 'Cannabis Use Disorder self-assessment' },
  '/dose':          { title: 'Know Your Dose',      subtitle: 'Understand your consumption safely' },
  '/tplan':         { title: 'T-Plan',              subtitle: 'Your personalised tapering plan' },
  '/interaction':   { title: 'Drug Interactions',   subtitle: 'Check cannabis interactions with your medications' },
};

// ─── Strain Recommendation Modal ─────────────────────────────────────────────
const RecommendationModal = ({ recommendations, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
      <div className="bg-gradient-to-r from-[#2E3A33] to-[#4a7c5e] px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-white font-bold text-lg">🌿 Strain Recommendations</h2>
          <p className="text-green-200 text-xs mt-0.5">Personalised based on your latest check-in</p>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-light leading-none transition">×</button>
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6CB28E] text-white font-semibold whitespace-nowrap flex-shrink-0">
                      #{i + 1} Pick
                    </span>
                  </div>
                  {rec.type && (
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[#2F7E57] border border-[#c3e6cb] font-medium uppercase tracking-wide">
                      {rec.type}
                    </span>
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
        <p className="text-[10px] text-[#7A6C58] text-center">
          🔒 For harm reduction purposes only. Always consult a healthcare professional.
        </p>
      </div>
    </div>
  </div>
);

// ─── AppLayout ────────────────────────────────────────────────────────────────
const AppLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen]           = useState(false);
  const [showDropdown, setShowDropdown]       = useState(false);
  const [loadingRec, setLoadingRec]           = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const dropdownRef = useRef(null);
  const location    = useLocation();
  const navigate    = useNavigate();
  const page        = PAGE_TITLES[location.pathname] || { title: 'Cannabis Therapy', subtitle: '' };

  // Close dropdown on outside click
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
    navigate('/auth');
    window.location.reload();
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

      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top bar ── */}
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-[#e1ddd3] px-4 sm:px-6 py-3 flex items-center gap-3 shadow-sm">

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-xl text-[#2E3A33] hover:bg-[#EAF5EF] transition flex-shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-[#2E3A33] truncate">{page.title}</h1>
            {page.subtitle && (
              <p className="text-xs text-[#7A6C58] truncate hidden sm:block">{page.subtitle}</p>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* 🌿 Strain Recommender */}
            <button
              onClick={fetchRecommendations}
              disabled={loadingRec}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6CB28E] text-white text-xs font-semibold hover:bg-[#5a9a7a] transition disabled:opacity-50 whitespace-nowrap"
              title="Get Strain Recommendations"
            >
              {loadingRec ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : '🌿'}
              {loadingRec ? 'Loading...' : 'Recommend'}
            </button>

            {/* Mobile: icon-only recommend button */}
            <button
              onClick={fetchRecommendations}
              disabled={loadingRec}
              className="sm:hidden p-2 rounded-xl border border-[#e1ddd3] bg-white text-[#2E3A33] hover:border-[#6CB28E] hover:bg-[#EAF5EF] transition disabled:opacity-50"
              title="Get Strain Recommendations"
            >
              🌿
            </button>

            {/* 💊 Drug Interaction — navigate to page */}
            <button
              type="button"
              onClick={() => navigate('/interaction')}
              className={`p-2 rounded-xl border transition ${
                isActive('/interaction')
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-[#e1ddd3] text-[#2E3A33] hover:border-blue-400 hover:bg-blue-50'
              }`}
              title="Drug Interaction Checker"
            >
              💊
            </button>

            {/* Profile dropdown — uses portal to escape stacking context */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1.5 rounded-full border border-transparent text-[#2E3A33] hover:bg-[#f5f3ee] transition"
                aria-label="Profile menu"
              >
                <CgProfile className="text-2xl" />
              </button>

              {showDropdown && createPortal(
                <div
                  style={{
                    position: 'fixed',
                    top: '56px',
                    right: '16px',
                    zIndex: 99999,
                  }}
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
                    <button
                      key={path}
                      onClick={() => { setShowDropdown(false); navigate(path); }}
                      className={`w-full px-4 py-3 text-sm text-[#2E3A33] hover:bg-[#EAF5EF] text-left transition ${isActive(path) ? 'bg-[#EAF5EF] font-medium' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-[#f0ebe1]" />
                  <button
                    onClick={() => { setShowDropdown(false); logout(); }}
                    className="w-full px-4 py-3 text-sm text-[#E76F51] hover:bg-red-50 text-left transition"
                  >
                    🚪 Logout
                  </button>
                </div>,
                document.body
              )}
            </div>

          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e1ddd3] flex items-center justify-around px-2 py-2 z-[1000] shadow-lg">
        {[
          { path: '/',            emoji: '💬', label: 'Chat' },
          { path: '/dashboard',   emoji: '📊', label: 'Dashboard' },
          { path: '/checkin',     emoji: '✅', label: 'Check-In' },
          { path: '/interaction', emoji: '💊', label: 'Interactions' },
          { path: '/dose',        emoji: '💨', label: 'Dose' },
        ].map(({ path, emoji, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${active ? 'text-[#2F7E57]' : 'text-[#7A6C58]'}`}
            >
              <span className="text-lg">{emoji}</span>
              <span className={`text-[10px] font-medium ${active ? 'text-[#2F7E57]' : 'text-[#7A6C58]'}`}>{label}</span>
              {active && <span className="w-1 h-1 rounded-full bg-[#4a9e6b]" />}
            </button>
          );
        })}
      </nav>

      {/* Strain Recommendation Modal */}
      {recommendations && (
        <RecommendationModal
          recommendations={recommendations}
          onClose={() => setRecommendations(null)}
        />
      )}
    </div>
  );
};

export default AppLayout;