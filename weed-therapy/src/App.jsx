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

function App() {
  const [token, setToken] = useState(null);
  const location = useLocation();

  const handleAuth = (token) => {
    setToken(token);
    localStorage.setItem('token', token);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) setToken(savedToken);
  }, []);

  if (!token && location.pathname !== '/auth') return <Navigate to="/auth" replace />;
  if (token && location.pathname === '/auth') return <Navigate to="/" replace />;

  return (
    <>
      {location.pathname === '/auth' ? (
        // Auth page — no sidebar
        <div className="min-h-screen bg-gradient-to-br from-[#f5f3ee] via-[#eef7f1] to-[#f0f5f8]">
          <Routes>
            <Route path="/auth" element={<AuthPage onAuth={handleAuth} />} />
          </Routes>
        </div>
      ) : (
        // All other pages — wrapped in AppLayout (sidebar + topbar)
        <AppLayout>
          <Routes>
            <Route path="/"               element={<Chatpage />} />
            <Route path="/checkin"        element={<CheckinPage />} />
            <Route path="/dashboard"      element={<DashboardPage />} />
            <Route path="/cud-screening"  element={<CUDScreening />} />
            <Route path="/interaction"    element={<DrugInteractionChecker />} />
            <Route path="/dose"           element={<DosePage />} />
            <Route path="/tplan"           element={<TplanPage />} />
          </Routes>
        </AppLayout>
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