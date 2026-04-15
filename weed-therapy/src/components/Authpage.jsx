// src/components/Authpage.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AuthPage = ({ onAuth }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setForm({ email: '', password: '', username: '' });
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, username } = form;
    if (!email || !password || password.length < 8) {
      toast.error('Please enter a valid email and password (min 8 chars)');
      return;
    }
    if (isSignUp && !username) {
      toast.error('Please enter a username');
      return;
    }
    setLoading(true);
    const endpoint = isSignUp ? 'register' : 'login';
    try {
      const payload = isSignUp ? { email, password, username } : { email, password };
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/${endpoint}`,
        payload
      );
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        onAuth(res.data.token);
        navigate('/');
      } else {
        toast.error(res.data.message || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      toast.error(isSignUp ? 'Registration failed.' : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7f2] via-[#fdfcf8] to-[#eef5f0] flex flex-col items-center justify-center px-4 py-8">

      {/* Logo / Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6CB28E] to-[#4a9e6b] flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-3xl">🌿</span>
        </div>
        <h1 className="text-2xl font-bold text-[#2E3A33]">Cannabis Therapy</h1>
        <p className="text-sm text-[#7A6C58] mt-1">Your AI-powered wellness companion</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-[#e8e2d9] overflow-hidden"
      >
        {/* Tab switcher */}
        <div className="flex bg-[#f5f3ee] p-1.5 m-4 rounded-2xl">
          {['Sign In', 'Sign Up'].map((label, i) => {
            const active = isSignUp === (i === 1);
            return (
              <button
                key={label}
                onClick={() => { setIsSignUp(i === 1); setForm({ email: '', password: '', username: '' }); }}
                className="relative flex-1 py-2 text-sm font-medium rounded-xl transition-colors duration-150 z-10"
                style={{ color: active ? '#2E3A33' : '#7A6C58' }}
              >
                {active && (
                  <motion.div
                    layoutId="auth-tab"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'signup' : 'signin'}
              initial={{ opacity: 0, x: isSignUp ? 12 : -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -12 : 12 }}
              transition={{ duration: 0.18 }}
            >
              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Username — sign up only */}
                <AnimatePresence>
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1">
                        <label className="block text-xs font-medium text-[#4a4a4a] mb-1.5">Username</label>
                        <input
                          type="text"
                          name="username"
                          value={form.username}
                          onChange={handleChange}
                          placeholder="e.g. green_journey"
                          required
                          className="w-full px-4 py-3 border border-[#e1ddd3] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E] focus:border-transparent bg-[#fdfcfa] transition"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-[#4a4a4a] mb-1.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 border border-[#e1ddd3] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E] focus:border-transparent bg-[#fdfcfa] transition"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-[#4a4a4a] mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min. 8 characters"
                      required
                      className="w-full px-4 py-3 pr-12 border border-[#e1ddd3] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6CB28E] focus:border-transparent bg-[#fdfcfa] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8e80] hover:text-[#2E3A33] transition p-1"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-2xl text-white font-semibold text-sm transition mt-2 shadow-sm ${
                    loading
                      ? 'bg-[#aacfb5] cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#6CB28E] to-[#5a9e7a] hover:from-[#5FA47F] hover:to-[#4e8f6c]'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Please wait...
                    </span>
                  ) : isSignUp ? 'Create Account' : 'Sign In'}
                </motion.button>
              </form>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-xs text-[#9a8e80] text-center max-w-xs"
      >
        🔒 Your data is private and secure. Anonymous mode available inside the app.
      </motion.p>
    </div>
  );
};

export default AuthPage;