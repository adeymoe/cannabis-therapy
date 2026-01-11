// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Chatpage from './components/Chatpage';
import AuthPage from './components/Authpage';
import CheckinPage from './components/CheckinPage';
import DashboardPage from './components/DashboardPage.jsx';
import 'react-toastify/dist/ReactToastify.css';
import Footer from './components/Footer.jsx';

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

  // Basic route-guarding
  if (!token && location.pathname !== '/auth') {
    return <Navigate to="/auth" replace />;
  }

  if (token && location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f3ee] via-[#eef7f1] to-[#f0f5f8] text-[#2E3A33]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Routes>
          <Route path="/" element={<Chatpage />} />
          <Route path="/auth" element={<AuthPage onAuth={handleAuth} />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>

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
      <Footer/>
    </div>
  );
}

export default App;