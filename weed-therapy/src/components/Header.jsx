// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CgProfile } from 'react-icons/cg';
import weedLogo from '../assets/weedLogo.jpg';

const Header = ({ title }) => {
  const [showDropdown, setShowDropdown] = useState(false);
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

  return (
    <header className="w-full flex justify-center mb-6 relative z-[1000]">
      <div
        className="w-full max-w-5xl rounded-2xl bg-white/80 backdrop-blur-md border border-[#e1ddd3] shadow-sm px-4 sm:px-6 py-3 flex items-center justify-between gap-3"
        ref={dropdownRef}
      >
        {/* Left: logo + brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-[#e1ddd3] bg-[#f5f3ee] flex items-center justify-center">
            <img
              src={weedLogo}
              alt="Weed Therapy Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-semibold text-[#2E3A33]">
                {title}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#EAF5EF] text-[10px] uppercase tracking-wide text-[#2F7E57] font-semibold">
                Beta
              </span>
            </div>
            <p className="hidden sm:block text-xs text-[#7A6C58]">
              Calm, AI-guided support for cannabis use and mental health.
            </p>
          </div>
        </div>

        {/* Right: primary nav icons + profile */}
        <div className="flex items-center gap-1 sm:gap-2 relative">
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
                  Weed Therapy
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
    </header>
  );
};

export default Header;