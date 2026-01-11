import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CgProfile } from 'react-icons/cg';
import weedLogo from '../assets/weedLogo.jpg';
import axios from 'axios';

const Header = ({ title }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
    window.location.reload();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;
  const onChat = location.pathname === '/';
  const onDashboard = location.pathname === '/dashboard';

  // Fetch strain recommendations based on latest check-in
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
      console.error('Error fetching recommendations:', err);
      alert('Error fetching recommendations');
    } finally {
      setLoadingRec(false);
    }
  };

  // Show recommendations in a simple modal
  const RecommendationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 relative shadow-lg overflow-y-auto max-h-[80vh]">
        <h2 className="text-xl font-bold mb-4">Strain Recommendations</h2>
        <button
          onClick={() => setRecommendations(null)}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 font-bold text-lg"
          aria-label="Close modal"
        >
          &times;
        </button>
        {recommendations.length === 0 && <p>No recommendations available.</p>}
        <ul className="space-y-6">
          {recommendations.map((rec, i) => (
            <li key={i} className="border p-4 rounded-md bg-green-50">
              <h3 className="font-semibold text-lg">{rec.name}</h3>
              {rec.imageUrl && (
                <img
                  src={rec.imageUrl}
                  alt={`${rec.name} strain`}
                  className="w-48 h-auto rounded-md mt-2 mb-3 object-cover shadow-md"
                />
              )}
              <p><strong>Why:</strong> {rec.rationale}</p>
              <p><strong>Safety:</strong> {rec.cautions}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <header className="w-full flex justify-center mb-6 relative z-[1000] px-2 sm:px-4">
      <div
        className="w-full max-w-5xl rounded-2xl bg-white/90 backdrop-blur-md border border-[#e1ddd3] shadow-sm px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3"
        ref={dropdownRef}
      >
        {/* Left: logo + brand */}
        <div className="flex items-center gap-3 flex-shrink-0 min-w-[180px]">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-[#e1ddd3] bg-[#f5f3ee] flex items-center justify-center">
            <img
              src={weedLogo}
              alt="Cannabis Therapy Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-[#2E3A33] truncate">
                Cannabis Therapy
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[9px] sm:text-[10px] uppercase tracking-wide text-[#2F7E57] font-semibold whitespace-nowrap">
                Beta
              </span>
            </div>
            <p className="hidden sm:block text-xs text-[#7A6C58] truncate max-w-[200px]">
              Calm, AI-guided support for cannabis use and mental health.
            </p>
          </div>
        </div>

        {/* Right: primary nav icons + profile + new button */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end flex-grow min-w-[220px]">
          {/* Recommend Strain Button */}
          <button
            onClick={fetchRecommendations}
            disabled={loadingRec}
            className="mr-2 px-3 py-1 rounded-lg bg-[#6CB28E] text-white font-semibold hover:bg-[#5a9a7a] transition disabled:opacity-50 whitespace-nowrap"
            title="Get Strain Recommendations"
          >
            {loadingRec ? 'Loading...' : 'Recommend Strain'}
          </button>

          {/* Chat icon */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`p-2 sm:p-2.5 rounded-full border transition flex items-center justify-center ${
              onChat
                ? 'bg-[#6CB28E] border-[#6CB28E] text-white shadow-sm'
                : 'bg-white border-[#e1ddd3] text-[#2E3A33] hover:border-[#6CB28E] hover:bg-[#EAF5EF]'
            }`}
            title="Go to Chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 8h10M7 12h6m-9 5.25V7a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H9.25L6 17.25z"
              />
            </svg>
          </button>

          {/* Dashboard icon */}
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className={`p-2 sm:p-2.5 rounded-full border transition flex items-center justify-center ${
              onDashboard
                ? 'bg-[#6CB28E] border-[#6CB28E] text-white shadow-sm'
                : 'bg-white border-[#e1ddd3] text-[#2E3A33] hover:border-[#6CB28E] hover:bg-[#EAF5EF]'
            }`}
            title="Go to Dashboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 19h16M7 16V8m5 8V5m5 11v-6"
              />
            </svg>
          </button>

          {/* Profile dropdown trigger */}
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="ml-1 p-1.5 sm:p-2 rounded-full border border-transparent text-[#2E3A33] hover:bg-[#f5f3ee] transition"
            aria-label="Profile menu"
          >
            <CgProfile className="text-2xl" />
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 top-12 w-52 bg-white border border-[#e1ddd3] rounded-xl shadow-lg z-[9999] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#f0ebe1]">
                <p className="text-xs text-[#7A6C58]">Signed in to</p>
                <p className="text-sm font-medium text-[#2E3A33]">
                  Cannabis Therapy
                </p>
              </div>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/dashboard');
                }}
                className={`w-full px-4 py-3 text-sm text-[#2E3A33] hover:bg-[#EAF5EF] text-left transition ${
                  isActive('/dashboard') ? 'bg-[#EAF5EF] font-medium' : ''
                }`}
              >
                📊 Recovery Dashboard
              </button>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/');
                }}
                className={`w-full px-4 py-3 text-sm text-[#2E3A33] hover:bg-[#EAF5EF] text-left transition ${
                  isActive('/') ? 'bg-[#EAF5EF] font-medium' : ''
                }`}
              >
                💬 Therapy Chat
              </button>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/checkin');
                }}
                className={`w-full px-4 py-3 text-sm text-[#2E3A33] hover:bg-[#EAF5EF] text-left transition ${
                  isActive('/checkin') ? 'bg-[#EAF5EF] font-medium' : ''
                }`}
              >
                ✅ Daily Check-In
              </button>

              <div className="border-t border-[#f0ebe1]" />

              <button
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                className="w-full px-4 py-3 text-sm text-[#E76F51] hover:bg-red-50 text-left transition"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recommendation Modal */}
      {recommendations && <RecommendationModal />}
    </header>
  );
};

export default Header;