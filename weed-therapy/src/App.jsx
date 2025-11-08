import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Chatpage from './components/Chatpage';
import AuthPage from './components/Authpage';

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

  if (!token && location.pathname !== '/auth') {
    return <Navigate to="/auth" replace />;
  }



  if (token && location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Routes>
        <Route path="/" element={<Chatpage />} />
        <Route path="/auth" element={<AuthPage onAuth={handleAuth} />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App;
