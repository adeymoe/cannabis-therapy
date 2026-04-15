// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppLayout from './components/AppLayout';
import Chatpage from './components/Chatpage';
import AuthPage from './components/Authpage';
import CheckinPage from './components/CheckinPage';
import DashboardPage from './components/DashboardPage.jsx';
import CUDScreening from './components/CUDScreening';
import DrugInteractionChecker from './components/DrugInteractionChecker';
import DosePage from './components/DosePage';
import TplanPage from './components/TplanPage.jsx';
import AppTour from './components/AppTour';

function App() {
  const [token, setToken]           = useState(null);
  const [showTour, setShowTour]     = useState(false);
  const location                    = useLocation();

  const handleAuth = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    // Show tour only on first ever login
    const done = localStorage.getItem('ct_tour_done');
    if (!done) setShowTour(true);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) setToken(savedToken);
    // Don't auto-show tour on page refresh — only triggered by handleAuth
  }, []);

  if (!token && location.pathname !== '/auth') return <Navigate to="/auth" replace />;
  if (token && location.pathname === '/auth') return <Navigate to="/" replace />;

  return (
    <>
      {location.pathname === '/auth' ? (
        <div className="min-h-screen bg-gradient-to-br from-[#f5f3ee] via-[#eef7f1] to-[#f0f5f8]">
          <Routes>
            <Route path="/auth" element={<AuthPage onAuth={handleAuth} />} />
          </Routes>
        </div>
      ) : (
        <AppLayout>
          <Routes>
            <Route path="/"               element={<Chatpage />} />
            <Route path="/checkin"        element={<CheckinPage />} />
            <Route path="/dashboard"      element={<DashboardPage />} />
            <Route path="/cud-screening"  element={<CUDScreening />} />
            <Route path="/interaction"    element={<DrugInteractionChecker />} />
            <Route path="/dose"           element={<DosePage />} />
            <Route path="/tplan"          element={<TplanPage />} />
          </Routes>
        </AppLayout>
      )}

      {/* App tour — shown once after very first login */}
      {showTour && (
        <AppTour onComplete={() => setShowTour(false)} />
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </>
  );
}

export default App;